const router = require('express').Router()
const prisma = require('../utils/prisma')

router.get('/', async (req, res, next) => {
  try {
    const { parent_id } = req.query
    const where = parent_id ? { parent_id } : {}
    const categories = await prisma.category.findMany({ where, orderBy: { name: 'asc' } })
    res.json({ success: true, data: categories })
  } catch (err) { next(err) }
})

module.exports = router
