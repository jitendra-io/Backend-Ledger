const mongoose = require ("mongoose")




async function connectDB(){
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connection successfully established!😭❤️")
    } catch (error) {
        console.log("Error in database connection!😭😭", error)
        process.exit(1)
    }
}

module.exports = connectDB;