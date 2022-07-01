const { CosmosClient } = require("@azure/cosmos");

const endpoint = "https://sweetshop23456662.documents.azure.com:443/";
const key = "oggggggMCdfgEGTghhha9HsUKikoghCmadfggmNTuTJBf0I9c3hhhhhhhhghNlPHqFV1w";
const client = new CosmosClient({ endpoint, key });


async function main() {
const { database } = await client.databases.createIfNotExists({ id: "Sweet Shop" });
    console.log(database.id);
    const { container } = await database.containers.createIfNotExists({ id: "stock" });
    const items = [
          { id: "1", name: "Twix", qty: 20, price: 0.70 },
          { id: "2", name: "Mars", qty: 30, price: 0.90 },
          { id: "3", name: "Snickers", qty: 40, price: 0.85 }
    ];
    for (const item of items ){
          container.items.create(item);
    }

}


main().catch((error) => {
  console.error(error);
});
