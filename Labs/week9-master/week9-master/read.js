const { CosmosClient } = require("@azure/cosmos");

const endpoint = "https://sweetshop234542.documents.azure.com:443/";
const key = "oTFZezCMCaiyxlf0EGT9Lddoa9HsUKikofGzxlY26hCmagb9NT345hiIhhhNlPHqFV1w==";
const client = new CosmosClient({ endpoint, key });


async function main() {
    const { database } = await client.databases.createIfNotExists({ id: "Sweet Shop" });
        console.log(database.id);
        const { container } = await database.containers.createIfNotExists({ id: "stock" });
        const { resources } = await container.items
          .query("SELECT * from c")
          .fetchAll();
    return resources;

}


main().catch((error) => {
      console.error(error);
}).then((resources) => {
for (const item of resources) {
                    console.log(`${item.name}, ${item.qty} ,  ${item.price}`);
    }
});
