const express = require('express');
const mongoose = require('mongoose');
const Order = require('./order');
const app = express();
const amqp = require("amqplib")
const PORT = process.env.PORT_ONE || 7072;

var channel, connection;

app.use(express.json());

mongoose.connect("mongodb://localhost/order-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('order service DB is now running');
}).catch((e) => {
    console.log(e);
})


async function connect() {
    const amqpServer = "amqp://localhost:5672";

    connection = await amqp.connect(amqpServer);

    channel = await connection.createChannel();

    await channel.assertQueue("ORDER")
}

function createOrder(products, userEmail) {
    let total = 0;

    for (let t = 0; t < products.length; t++) {
        total += products[t].price
    } //docker run -p 5672:5672 rabbitmq

    console.log("total", total)

    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total
    });

    newOrder.save()

    return newOrder;
}

connect().then(() => {

    channel.consume("ORDER", data => {
        const {
            products,
            userEmail
        } = JSON.parse(data.content)

        console.log("Consuming orders queue");
        console.log(products, userEmail);

        const newOrder = createOrder(products, userEmail);

        console.log("newOrder is", newOrder)

        channel.ack(data);

        channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({
            newOrder
        })))


    })
});


app.listen(PORT, () => {
    console.log('order service at ', PORT);
})