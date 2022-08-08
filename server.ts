import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from './models/User'

dotenv.config()

mongoose.connect(process.env.DATABASE_URL, () => {
    console.log('Database connected')
})

const app = express()

app.get('/users', verifyToken, async (req, res) => {
    const users = await User.find()

    res.json(users)
})

async function verifyToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (token == null) return res.sendStatus(401)
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err: any, user: any) => {
        if (err) {
            return res.sendStatus(403)
        }

        req.user = user
        
        next()
    })
} 

app.listen(4000)