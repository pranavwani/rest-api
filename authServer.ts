import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from './models/User'
import Token from './models/Token'

dotenv.config()

mongoose.connect(process.env.DATABASE_URL, () => {
    console.log('Database connected')
})

const app = express()

app.use(express.json())

app.post('/register', async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    if (username === null || password === null) res.sendStatus(403)

    const isExist = await User.find({ username: username }).count()

    if (isExist > 0) return res.status(409).send('Username already used')

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({ username: req.body.username, password: hashedPassword })

    await user.save()

    const refreshToken = await generateRefreshToken({ username })

    const token = await Token.find().limit(1)

    if (token.length == 0) {
        await new Token({ tokens: [refreshToken] }).save()
    } else {
        token[0].tokens.push(refreshToken)

        await Token.updateOne({ tokens: { $exists: true } }, token[0])
    }

    res.status(201).json({
        message: 'User created successfully',
        accessToken: await generateAccessToken({ username }),
        refreshToken
    })
})

app.post('/login', async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    if (username === null || password === null) return res.status(403).send('User does not exist')

    const user = await User.find({ username })

    if (await bcrypt.compare(password, user[0].password)) {
        const refreshToken = await generateRefreshToken({ username })

        const token = await Token.find().limit(1)

        if (token.length == 0) {
            await new Token({ tokens: [refreshToken] }).save()
        } else {
            token[0].tokens.push(refreshToken)

            await Token.updateOne({ tokens: { $exists: true } }, token[0])
        }

        res.status(200).json({
            message: 'You have logged-in successfully',
            accessToken: await generateAccessToken({ username }),
            refreshToken
        })
    } else return res.sendStatus(401)
})

app.post('/token', async (req, res) => {
    const token = req.body.token

    if (token == null) return res.sendStatus(401)

    const tokens = await Token.find().limit(1)

    if (tokens && tokens[0].tokens.includes(token)) {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err: any, user: any) => {
            if (err) {
                return res.sendStatus(403)
            }
            return res.status(200).json({
                message: 'Session renewed successfully',
                accessToken: await generateAccessToken({ username: user.username })
            })
        })
    } else return res.sendStatus(403)
})

app.delete('/logout', async (req, res) => {
    const tokens = await Token.find().limit(1)

    tokens[0].tokens = tokens[0].tokens.filter(token => token !== req.body.token)

    await Token.updateOne({ tokens: { $exists: true } }, { tokens: tokens[0].tokens })

    return res.sendStatus(204)
})

app.listen(3000)

async function generateAccessToken(user: { username: string }): Promise<string> {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30s' })
}

async function generateRefreshToken(user: { username: string }): Promise<string> {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
}