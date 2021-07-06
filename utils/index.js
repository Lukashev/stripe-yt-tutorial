export const formatUSD = amount => {
  return `$${(amount / 100).toFixed(2)}`;
}

export const formatToStripe = value => {
  return parseFloat(value) * 100
}