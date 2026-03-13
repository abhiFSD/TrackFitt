import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { tokenAPI } from '../services/api';
import { Token, TokenTransactionType, UserTokenBalance, TokenRequest, TokenRequestStatus } from '../interfaces';
import { useToken } from '../context/TokenContext';
import { formatLocalDate, formatLocalDateTime } from '../utils/dateUtils';
import DateDisplay from '../components/common/DateDisplay';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`token-tabpanel-${index}`}
      aria-labelledby={`token-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TokensPage: React.FC = () => {
  const { tokenBalance, refreshTokenBalance } = useToken();
  const [tabValue, setTabValue] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokenRequests, setTokenRequests] = useState<TokenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for token request dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch token history
        const historyData = await tokenAPI.getHistory();
        setTokens(historyData);
        
        // Fetch token requests
        const requestsData = await tokenAPI.getTokenRequests();
        setTokenRequests(requestsData);
      } catch (err) {
        console.error('Error fetching token data:', err);
        setError('Failed to load token data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenRequestDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseRequestDialog = () => {
    setOpenDialog(false);
    setRequestAmount('');
    setRequestReason('');
  };

  const handleSubmitRequest = async () => {
    if (!requestAmount || parseInt(requestAmount) <= 0) {
      return;
    }

    try {
      setSubmitting(true);
      await tokenAPI.createTokenRequest({
        amount: parseInt(requestAmount),
        reason: requestReason || undefined
      });
      handleCloseRequestDialog();
      setError(null);
      
      // Refresh token requests
      const requestsData = await tokenAPI.getTokenRequests();
      setTokenRequests(requestsData);
    } catch (err) {
      console.error('Error submitting token request:', err);
      setError('Failed to submit token request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionTypeChip = (type: TokenTransactionType) => {
    let color;
    switch (type) {
      case TokenTransactionType.EARN:
        color = 'success';
        break;
      case TokenTransactionType.SPEND:
        color = 'error';
        break;
      case TokenTransactionType.ADMIN_ADJUSTMENT:
        color = 'info';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={type} 
        color={color as any} 
        size="small" 
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Your Tokens
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Earn tokens by completing workouts and use them to unlock premium features.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Current Balance
            </Typography>
            <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
              {tokenBalance}
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={handleOpenRequestDialog}
          >
            Request Tokens
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Token History" />
          <Tab label="Token Requests" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          {tokens.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <DateDisplay date={token.timestamp} format="datetime" />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body1"
                          color={token.transaction_type === TokenTransactionType.SPEND ? 'error' : 'success'}
                          sx={{ fontWeight: 'medium' }}
                        >
                          {token.transaction_type === TokenTransactionType.SPEND ? '-' : '+'}{token.amount}
                        </Typography>
                      </TableCell>
                      <TableCell>{getTransactionTypeChip(token.transaction_type)}</TableCell>
                      <TableCell>{token.description || 'No description'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) :
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No token transactions yet. Complete workouts to earn tokens!
              </Typography>
            </Box>
          }
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {tokenRequests.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tokenRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <DateDisplay date={request.request_date} format="date" />
                      </TableCell>
                      <TableCell>{request.amount}</TableCell>
                      <TableCell>{request.reason || 'No reason provided'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status} 
                          color={
                            request.status === TokenRequestStatus.APPROVED 
                              ? 'success' 
                              : request.status === TokenRequestStatus.REJECTED 
                                ? 'error' 
                                : 'warning'
                          } 
                          size="small" 
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You don't have any token requests yet.
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleOpenRequestDialog}
              >
                Create New Request
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>
      
      {/* Token Request Dialog */}
      <Dialog open={openDialog} onClose={handleCloseRequestDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Request Tokens</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Please provide details for your token request. Administrators will review your request.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={requestAmount}
            onChange={(e) => setRequestAmount(e.target.value)}
            error={!!requestAmount && parseInt(requestAmount) <= 0}
            helperText={requestAmount && parseInt(requestAmount) <= 0 ? 'Amount must be greater than 0' : ''}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Reason (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseRequestDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRequest} 
            variant="contained"
            disabled={!requestAmount || parseInt(requestAmount) <= 0 || submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TokensPage; 