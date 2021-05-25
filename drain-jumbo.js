
/* Configure sharding for test collection */
sh.enableSharding('test')
sh.shardCollection('test.test', {a: 1})

/* Insert documents into future jumbo chunk */
for (var i = 0; i < 1000; i++){
    doc = {a: 0, b: new Array(1000000).join("a")}
        db.getSiblingDB('test').test.insert(doc)
        print("Collection size: " + db.getSiblingDB('test').test.stats().size + " | Collection docs: " + db.getSiblingDB('test').test.stats().count)
}

sh.status() //should see everything in a single chunk

passwordPrompt()

jshard = db.getSiblingDB('config').chunks.findOne({ns: "test.test"}).shard
print("Found chunk in shard " + jshard + ". Removing...")
printjson(db.adminCommand({removeShard: jshard}))

passwordPrompt()

sh.status() //should see chunk marked as jumbo
