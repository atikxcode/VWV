import { NextResponse } from 'next/server'
const SSLCommerzPayment = require('sslcommerz-lts')

const store_id = process.env.SSLCOMMERZ_STORE_ID
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD
const is_live = process.env.NODE_ENV === 'production'

export async function POST(req) {
  try {
    const paymentData = await req.json()

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)

    const data = {
      total_amount: paymentData.total_amount,
      currency: paymentData.currency,
      tran_id: paymentData.tran_id,
      success_url: paymentData.success_url,
      fail_url: paymentData.fail_url,
      cancel_url: paymentData.cancel_url,
      ipn_url: paymentData.ipn_url,
      shipping_method: paymentData.shipping_method,
      product_name: paymentData.product_name,
      product_category: paymentData.product_category,
      product_profile: paymentData.product_profile,
      cus_name: paymentData.cus_name,
      cus_email: paymentData.cus_email,
      cus_add1: paymentData.cus_add1,
      cus_city: paymentData.cus_city,
      cus_state: paymentData.cus_state,
      cus_postcode: paymentData.cus_postcode,
      cus_country: paymentData.cus_country,
      cus_phone: paymentData.cus_phone,
      ship_name: paymentData.ship_name,
      ship_add1: paymentData.ship_add1,
      ship_city: paymentData.ship_city,
      ship_postcode: paymentData.ship_postcode,
      ship_country: paymentData.ship_country,
    }

    const apiResponse = await sslcz.init(data)

    return NextResponse.json({
      success: true,
      GatewayPageURL: apiResponse.GatewayPageURL,
      sessionkey: apiResponse.sessionkey,
    })
  } catch (error) {
    console.error('SSLCommerz Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
