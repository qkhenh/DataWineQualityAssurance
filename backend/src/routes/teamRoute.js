import express from 'express'
import * as teamController from '../controllers/teamController.js'

const router = express.Router()

router.get('/', teamController.getTeam)
router.delete('/:userId', teamController.removeMember)

export default router
