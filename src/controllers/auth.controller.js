const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")


async function userRegisterController(req, res) {
    try {
        const { email, name, password } = req.body

        if (!email || !name || !password) {
            return res.status(400).json({
                message: "Email, name, and password are required",
                status: "Failed"
            })
        }

        const isExist = await userModel.findOne({ email })

        if (isExist) {
            return res.status(422).json({
                message: "User already exists with this email😒",
                status: "Failed⚠️"
            })
        }

        const user = await userModel.create({
            email,
            password,
            name
        })

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        )

        res.cookie("token", token)

        await emailService.sendRegistrationEmail(user.email, user.name)

        return res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        })  
        
        
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: "Failed"
        })
    }

    
}


async function userLoginController(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
                status: "Failed"
            })
        }

        const user = await userModel.findOne({ email }).select("+password")

        if (!user) {
            return res.status(401).json({
                message: "Email or password is invalid😒"
            })
        }

        const isValidPassword = await user.comparePassword(password)

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is invalid😒😒"
            })
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        )

        res.cookie("token", token)

        return res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server error",
            status: "Failed"
        })
    }
}

module.exports = { userRegisterController, userLoginController }


