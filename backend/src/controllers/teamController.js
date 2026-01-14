import * as teamModel from '../models/Team.js'

export const getTeam = async (req, res) => {
  try {
    const warehouseId = req.user.warehouse_id
    if (!warehouseId) {
      return res.status(400).json({ message: 'User does not belong to a warehouse' })
    }

    const members = await teamModel.getTeamMembers(warehouseId)
    res.json(members)
  } catch (error) {
    console.error('Error fetching team members:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params
    const requesterId = req.user.user_id
    const warehouseId = req.user.warehouse_id

    // Check if requester is the owner
    const ownerId = await teamModel.getWarehouseOwner(warehouseId)
    
    if (requesterId !== ownerId) {
      return res.status(403).json({ message: 'Only the warehouse owner can remove members' })
    }

    // Prevent owner from removing themselves (optional but good practice)
    if (parseInt(userId) === requesterId) {
        return res.status(400).json({ message: 'Cannot remove yourself' });
    }

    await teamModel.removeMemberFromWarehouse(userId)
    res.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing member:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
