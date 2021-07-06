import express from 'express'
import path from 'path'
import api from './api/index.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

dotenv.config()

const __dirname = path.resolve(path.dirname(''))
const app = express(), port = 3000, router = express.Router()

app.set('view engine', 'ejs')

app.use(express.static(__dirname))
app.use('/css', express.static('css'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use('/', router)

app.get('/', (_, res) => {
  res.render('base', {
    path: 'home',
    payload: {}
  })
})

router.get('/admin', async (_, res) => {
  try {
    const productList = await api.getAllProducts()
    res.render('base', {
      path: 'admin',
      payload: {
        productList
      }
    })
  } catch(e) {
    res.status(400).send(e.message)
  }
})

router.get('/admin/createProduct', async (_, res) => {
  res.render('base', {
    path: 'createProduct',
    payload: {
      status: null,
      responseMsg: null
    }
  })
})

router.post('/admin/createProduct', async (req, res) => {
  let renderBase = {
    path: 'createProduct',
    payload: {
      status: 200,
      responseMsg: 'You successfully added product'
    }
  }
  try {
    const result = await api.createProduct(req.body)
    if (result.message) throw new Error(result)
    res.render('base', renderBase)
  } catch(e) {
    renderBase.payload.responseMsg = e.message
    renderBase.payload.status = 400
    res.render('base', renderBase)
  }
})

router.post('/admin/createPlan', async (req, res) => {
  const { productId, productName, productDesc } = req.body
  res.render('base', {
    path: 'createPlan',
    payload: {
      status: null,
      responseMsg: null,
      productId,
      productName,
      productDesc
    }
  })
})

router.post('/admin/createProductPlan', async(req, res) => {
  let renderBase = {
    path: 'createPlan',
    payload: {
      status: 200,
      responseMsg: 'You successfully create new plan',
      ...req.body
    }
  }
  try {
    const result = await api.createPlan(req.body)
    if (result.message) throw new Error(result)
    res.render('base', renderBase)
  } catch(e) {
    renderBase.payload.responseMsg = e.message
    renderBase.payload.status = 400
    res.render('base', renderBase)
  }
})

router.get('/customer', async (req, res) => {
  const customerId = req.cookies['stripe_customer_id']
  const productList = await api.getAllProducts(customerId)
  const subs = productList.reduce((acc, product) => [...acc, ...product.subs],[])
    res.render('base', {
      path: 'customer',
      payload: {
        productList,
        subs
      }
    })
})

router.post('/customer/subscribe', async (req, res) => {
  res.render('base', {
    path: 'subscribe',
    payload: {
      status: null,
      responseMsg: null,
      stripePubKey: process.env.STRIPE_PUBLISHABLE_KEY,
      ...req.body
    }
  })
})

router.post('/customer/processPayment', async (req, res) => {
  let renderBase = {
    path: 'subscribe',
    payload: {
      status: 200,
      responseMsg: `You successfully subscribe for ${req.body.productName} - ${req.body.planName}`,
      stripePubKey: process.env.STRIPE_PUBLISHABLE_KEY,
      ...req.body
    }
  }
  const customerId = req.cookies['stripe_customer_id']
  try {
    const result = await api.createCustomerAndSubscription(req.body, customerId)
    if (result.message) throw new Error(result)
    res.cookie('stripe_customer_id', customerId ? customerId : result.customer.id, { maxAge: 86400000 })
    res.render('base', renderBase)
  } catch(e) {
    renderBase.payload.responseMsg = e.message
    renderBase.payload.status = 400
    res.render('base', renderBase)
  }
})

app.listen(port, () => {
  console.log(`App listening on port: ${port}`)
})