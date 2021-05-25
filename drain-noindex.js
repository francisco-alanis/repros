/* Generate random numbers */
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

/* Configure sharding for test collection */
sh.enableSharding('test')
sh.shardCollection('test.test', {a: 1})

/* Decrease chunk size to create more chunks */
db.getSiblingDB('config').settings.save( { _id:"chunksize", value: 1 } )

/* Add index */
db.getSiblingDB('test').test.createIndex({a: 1, c: 1})

/* Insert documents across sharded cluster */
for (var i = 0; i < 50000; i++){
    doc = {a: getRndInteger(0, 1000), b: new Array(1000).join("a"), c: getRndInteger(0, 1000)}
    db.getSiblingDB('test').test.insert(doc)
    if (i % 1000 == 0){
        print("Collection size: " + db.getSiblingDB('test').test.stats().size + " | Collection docs: " + db.getSiblingDB('test').test.stats().count)
    }
}

sh.status() //should see everything spread across nodes

/* remove index on shard1 */
shardhost = db.getSiblingDB('config').shards.findOne({_id: "shard01"}).host
shard = Mongo(shardhost)
shard.getDB("test").test.dropIndex({a: 1, c: 1})
print("Remove index from shard " + shardhost + ":")
printjson(shard.getDB("test").test.getIndexes())
print("Indexes from mongos:")
printjson(db.getSiblingDB("test").test.getIndexes())

passwordPrompt()

/* remove shard 02 to force some chunks to migrate to shard01 */
print("Removing shard02")
printjson(db.adminCommand({removeShard: "shard02"}))
print("Some chunks should be going to shard01. This should fail because of the missing index")

passwordPrompt()

/* check removal status once again */
printjson(db.adminCommand({removeShard: "shard02"}))
sh.status()
