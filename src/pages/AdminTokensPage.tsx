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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { tokenAPI, userAPI } from '../services/api';
import { Token, TokenRequestStatus, TokenRequest, UserTokenBalance, User, TokenTransactionType } from '../interfaces';
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

const AdminTokensPage: React.FC = () => {
  const { refreshTokenBalance } = useToken();
  const [tabValue, setTabValue] = useState(0);
  const [tokenHistory, setTokenHistory] = useState<Token[]>([]);
  const [tokenRequests, setTokenRequests] = useState<TokenRequest[]>([]);
  const [userBalances, setUserBalances] = useState<UserTokenBalance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialog for confirming token request approval/rejection
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    requestId: 0,
    action: 'approve' as 'approve' | 'reject',
    userId: 0
  });

  useEffect(() => {
    const fetchAdminTokenData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch users for filtering
        const usersData = await userAPI.getAllUsers();
        setUsers(usersData);
        
        // Fetch all token history
        const historyData = await tokenAPI.getAllUsersTokenHistory();
        setTokenHistory(historyData);
        
        // Fetch all token requests
        const requestsData = await tokenAPI.getAllTokenRequests();
        setTokenRequests(requestsData);
        
        // Fetch all user balances
        const balancesData = await tokenAPI.getAllUsersTokenBalance();
        setUserBalances(balancesData);
      } catch (err) {
        console.error('Error fetching admin token data:', err);
        setError('Failed to load token data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminTokenData();
  }, [refreshTrigger]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUserFilterChange = async (event: SelectChangeEvent) => {
    const userId = event.target.value;
    setSelectedUserId(userId);
    
    try {
      setActionLoading(true);
      
      if (userId === '') {
        const historyData = await tokenAPI.getAllUsersTokenHistory();
        setTokenHistory(historyData);
      } else {
        const historyData = await tokenAPI.getAllUsersTokenHistory(Number(userId));
        setTokenHistory(historyData);
      }
    } catch (err) {
      console.error('Error filtering token history:', err);
      setError('Failed to filter token history.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusFilterChange = async (event: SelectChangeEvent) => {
    const status = event.target.value;
    setSelectedStatus(status);
    
    try {
      setActionLoading(true);
      
      if (status === '') {
        const requestsData = await tokenAPI.getAllTokenRequests();
        setTokenRequests(requestsData);
      } else {
        const requestsData = await tokenAPI.getAllTokenRequests(status as TokenRequestStatus);
        setTokenRequests(requestsData);
      }
    } catch (err) {
      console.error('Error filtering token requests:', err);
      setError('Failed to filter token requests.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDialogOpen = (requestId: number, action: 'approve' | 'reject', userId: number) => {
    setConfirmDialog({
      open: true,
      requestId,
      action,
      userId
    });
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  const handleTokenRequestAction = async () => {
    const { requestId, action, userId } = confirmDialog;
    
    try {
      setActionLoading(true);
      
      // Update the token request status
      const status = action === 'approve' ? TokenRequestStatus.APPROVED : TokenRequestStatus.REJECTED;
      await tokenAPI.updateTokenRequest(requestId, status);
      
      // Refresh token requests and user balances
      const requestsData = await tokenAPI.getAllTokenRequests();
      setTokenRequests(requestsData);
      
      const balancesData = await tokenAPI.getAllUsersTokenBalance();
      setUserBalances(balancesData);
      
      // If we're viewing history for this user, refresh it
      if (selectedUserId === userId.toString() || selectedUserId === '') {
        const historyData = selectedUserId === '' 
          ? await tokenAPI.getAllUsersTokenHistory()
          : await tokenAPI.getAllUsersTokenHistory(Number(selectedUserId));
        setTokenHistory(historyData);
      }
      
      // Refresh the token balance in the context
      refreshTokenBalance();
      
      setRefreshTrigger(prev => prev + 1);
      handleConfirmDialogClose();
    } catch (err) {
      console.error(`Error ${action}ing token request:`, err);
      setError(`Failed to ${action} token request.`);
    } finally {
      setActionLoading(false);
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

  const getRequestStatusChip = (status: TokenRequestStatus) => {
    let color;
    switch (status) {
      case TokenRequestStatus.APPROVED:
        color = 'success';
        break;
      case TokenRequestStatus.REJECTED:
        color = 'error';
        break;
      case TokenRequestStatus.PENDING:
        color = 'warning';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={status} 
        color={color as any} 
        size="small" 
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  const getUsernameById = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `User ID: ${userId}`;
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
          Token Management
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Manage token transactions, review and approve token requests.
        </Typography>
      </Paper>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Token Requests" />
          <Tab label="Token History" />
          <Tab label="User Balances" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="status-filter-label">Filter by Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={selectedStatus}
                label="Filter by Status"
                onChange={handleStatusFilterChange}
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value={TokenRequestStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={TokenRequestStatus.APPROVED}>Approved</MenuItem>
                <MenuItem value={TokenRequestStatus.REJECTED}>Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {tokenRequests.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request Date</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tokenRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <DateDisplay date={request.request_date} format="date" />
                      </TableCell>
                      <TableCell>{getUsernameById(request.user_id)}</TableCell>
                      <TableCell>{request.amount}</TableCell>
                      <TableCell>{request.reason || 'No reason provided'}</TableCell>
                      <TableCell>{getRequestStatusChip(request.status)}</TableCell>
                      <TableCell>
                        {request.status === TokenRequestStatus.PENDING && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success"
                              onClick={() => handleConfirmDialogOpen(request.id, 'approve', request.user_id)}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="error"
                              onClick={() => handleConfirmDialogOpen(request.id, 'reject', request.user_id)}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No token requests found.
              </Typography>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="user-filter-label">Filter by User</InputLabel>
              <Select
                labelId="user-filter-label"
                value={selectedUserId}
                label="Filter by User"
                onChange={handleUserFilterChange}
                size="small"
              >
                <MenuItem value="">All Users</MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id.toString()}>{user.username}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {tokenHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tokenHistory.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <DateDisplay date={token.timestamp} format="datetime" />
                      </TableCell>
                      <TableCell>{getUsernameById(token.user_id)}</TableCell>
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
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No token history found.
              </Typography>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {userBalances.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Current Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userBalances.map((balance) => (
                    <TableRow key={balance.user_id}>
                      <TableCell>{getUsernameById(balance.user_id)}</TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary">
                          {balance.balance}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No user balances found.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmDialog.action === 'approve' ? 'Approve Token Request' : 'Reject Token Request'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmDialog.action} this token request from {getUsernameById(confirmDialog.userId)}?
          </Typography>
          {confirmDialog.action === 'approve' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will add tokens to the user's balance.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button 
            onClick={handleTokenRequestAction} 
            color={confirmDialog.action === 'approve' ? 'success' : 'error'}
            variant="contained"
            autoFocus
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTokensPage; 