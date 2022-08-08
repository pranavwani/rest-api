import mongoose from 'mongoose'

const tokenSchema = new mongoose.Schema({
    tokens: {
        type: Array
    }
})

export default mongoose.model('Token', tokenSchema)