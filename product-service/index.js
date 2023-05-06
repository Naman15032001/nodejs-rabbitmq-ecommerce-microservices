const express = require('express');
const mongoose = require('mongoose');
const Product = require('./product');
const app = express();
const isAuthenticated = require('../isAuthenticated');
const amqp = require("amqplib")
const PORT = process.env.PORT_ONE || 7071;

var channel, connection, order;

app.use(express.json());

mongoose.connect("mongodb://localhost/product-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('product service DB is now running');
}).catch((e) => {
    console.log(e);
})


async function connect() {
    const amqpServer = "amqp://localhost:5672";

    connection = await amqp.connect(amqpServer);

    channel = await connection.createChannel();

    await channel.assertQueue("PRODUCT")
}

connect();

//create a new product 

app.post('/product/create', isAuthenticated, async (req, res) => {

    //req.user

    const {
        name,
        description,
        price
    } = req.body;

    const newProduct = new Product({
        name,
        description,
        price
    });

    newProduct.save();

    return res.json(newProduct);
})


//buy a product

//user send products ids in array to buy 
//create an order with those products with sum of prices

app.post('/product/buy', isAuthenticated, async (req, res) => {

    //req.user

    const {
        ids
    } = req.body;

    const products = await Product.find({
        _id: {
            $in: ids
        }
    });

    channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({
        products,
        userEmail: req.user.email
    })))

    channel.consume("PRODUCT", data => {
        order = JSON.parse(data.content)

        console.log("Consuming products queue");
        console.log(order);

        channel.ack(data);

        console.log("here1", order)

        console.log("here2")
    })

    return res.json(order);
})


app.listen(PORT, () => {
    console.log('product service at ', PORT);
})

//64562ad60617ca9e1b0f2b0c
//64562b0c0617ca9e1b0f2b0e
//64562b210617ca9e1b0f2b10