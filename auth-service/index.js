const express = require('express');
const mongoose = require('mongoose');
const User = require('./user');
const app = express();
const jwt = require("jsonwebtoken")

const PORT = process.env.PORT_ONE || 7070;

mongoose.connect("mongodb://localhost/auth-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Auth service DB is now running');
}).catch((e) => {
    console.log(e);
})

app.use(express.json());

//register 

app.post('/auth/register', async (req, res) => {

    const {
        email,
        password,
        name
    } = req.body;

    //console.log(email,password,name)
    const userExists = await User.findOne({
        email
    });

    if (userExists) {
        return res.json({
            message: "User already exists"
        })
    } else {

        const newUser = new User({
            name,
            email,
            password
        });

        newUser.save();

        return res.json(newUser)
    }


})

//login


app.post('/auth/login', async (req, res) => {

    const {
        email,
        password
    } = req.body;

    

    const user = await User.findOne({
        email
    });

    if (!user) {
        return res.json({
            message: 'User doesnt exists'
        })
    } else {

        //check if password is correct 

        if (user.password !== password) {
            return res.json({
                message: "Incorrect password"
            })
        }

        const payload = {
            email,
            name: user.name
        }

        jwt.sign(payload, "secret", (err, token) => {
            if (err) {
                console.log(err);
            }

            return res.json({
                token
            })
        })
    }


})

app.listen(PORT, () => {
    console.log('auth service at ', PORT);
})