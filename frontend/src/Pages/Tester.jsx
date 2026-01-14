import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container, 
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material'
import useTestStore from '../stores/useTestStore'
import Header from '../Components/Header'

const Tester = () => {
  const { submitTestResult, isSubmitting, testHistory, fetchTestHistory, loadingHistory } = useTestStore()
  const [formData, setFormData] = useState({
    productId: '',
    score: '',
    description: ''
  })

  useEffect(() => {
    fetchTestHistory()
  }, [fetchTestHistory])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.productId || !formData.score) return

    await submitTestResult({
      productId: formData.productId,
      score: parseFloat(formData.score),
      description: formData.description
    })

    // Reset form after successful submission
    setFormData({
      productId: '',
      score: '',
      description: ''
    })
  }

  return (
    <Box>
      <Header />
      <Toolbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Container maxWidth="sm" sx={{ mb: 6 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Submit Test Result
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Product ID"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Score"
                name="score"
                type="number"
                inputProps={{ step: '0.1', min: '0', max: '10' }}
                value={formData.score}
                onChange={handleChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                margin="normal"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Result'}
              </Button>
            </Box>
          </Paper>
        </Container>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Test History & Comparison
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product ID</TableCell>
                  <TableCell align="right">Tester Score</TableCell>
                  <TableCell align="right">Model Score</TableCell>
                  <TableCell align="right">Difference</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingHistory ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Loading history...</TableCell>
                  </TableRow>
                ) : testHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No test history found.</TableCell>
                  </TableRow>
                ) : (
                  testHistory.map((row) => {
                    const diff = row.model_score !== null 
                      ? Math.abs(row.tester_score - row.model_score).toFixed(2) 
                      : 'N/A';

                    return (
                      <TableRow key={row.test_id}>
                        <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                        <TableCell>{row.product_id}</TableCell>
                        <TableCell align="right">{Number(row.tester_score).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          {row.model_score !== null ? Number(row.model_score).toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {diff !== 'N/A' ? (
                            <Chip 
                              label={diff} 
                              color={parseFloat(diff) > 1.0 ? "error" : "success"} 
                              size="small" 
                              variant="outlined"
                            />
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{row.description || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  )
}

export default Tester
