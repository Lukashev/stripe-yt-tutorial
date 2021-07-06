import dotenv from 'dotenv'
import Stripe from 'stripe'
import { formatToStripe, formatUSD } from '../utils/index.js'

dotenv.config()

const stripe = Stripe(process.env.STRIPE_PRIVATE_KEY)

const createProduct = async (body) => {
  try {
    return await stripe.products.create({ ...body })
  } catch(e) {
    return e
  }
}

const createPlan = async ({ productId, interval_count, nickname, interval, amount, currency }) => {
  const payload = {
    product: productId,
    amount: formatToStripe(amount),
    interval_count: +interval_count,
    nickname,
    interval,
    currency
  }
  try {
    return await stripe.plans.create(payload)
  } catch(e) {
    return e
  }
}

const getAllProducts = async (customerId) => {
  try {
    const responses = await Promise.all(
      [
        stripe.products.list({}),
        stripe.plans.list({}),
        customerId ? stripe.subscriptions.list({ customer: customerId }) : Promise.resolve(null)
      ]
    )
    let products = responses[0].data || [], plans = responses[1].data || [], subs = responses[2]?.data

    plans = plans.map(plan => ({ ...plan, amount: formatUSD(plan.amount) }))
    products.forEach(product => {
      const filteredPlans = plans.filter(plan => {
        return plan.product === product.id
      })
      product.subs = []
      if (subs) {
        subs.forEach(sub => {
          product.subs.push(...sub.items.data.map(s => ({ ...s,  productName: product.name, amount: formatUSD(s.plan.amount) })))
        })
      }
      product.plans = filteredPlans
    })

    return products
  } catch(e){
    return e
  }
}

const createCustomerAndSubscription = async (body, customerId) => {
  try {
    const customer = customerId ? { id: customerId } : await stripe.customers.create({ source: body.stripeToken, email: body.customerEmail })
    const subscription = await  stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          plan: body.planId
        }
      ]
    })
    return { customer, subscription }
  } catch(e) {
    return e
  }
}



export default {
  createProduct,
  getAllProducts,
  createPlan,
  createCustomerAndSubscription
}