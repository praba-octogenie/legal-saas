import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Gavel as GavelIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { selectUser } from '@/store/slices/authSlice';

// Types
interface DashboardStats {
  totalClients: number;
  totalCases: number;
  totalDocuments: number;
  totalHearings: number;
  totalInvoices: number;
  recentCases: {
    id: string;
    title: string;
    caseNumber: string;
    court: string;
    nextHearingDate: string | null;
    status: string;
  }[];
  upcomingHearings: {
    id: string;
    caseId: string;
    caseTitle: string;
    court: string;
    date: string;
    time: string;
    purpose: string;
  }[];
  casesByType: {
    type: string;
    count: number;
  }[];
  casesByStatus: {
    status: string;
    count: number;
  }[];
  revenueByMonth: {
    month: string;
    amount: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Dashboard = () => {
  const { t } = useTranslation('dashboard');
  const user = useSelector(selectUser);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get<DashboardStats>('/api/dashboard/stats');
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(t('errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        {t('welcomeMessage', { name: user?.name || t('user') })}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            }}
          >
            <PeopleIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4">{stats?.totalClients || 0}</Typography>
            <Typography variant="subtitle1">{t('totalClients')}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'secondary.light',
              color: 'secondary.contrastText',
            }}
          >
            <GavelIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4">{stats?.totalCases || 0}</Typography>
            <Typography variant="subtitle1">{t('totalCases')}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'success.light',
              color: 'success.contrastText',
            }}
          >
            <EventIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4">{stats?.totalHearings || 0}</Typography>
            <Typography variant="subtitle1">{t('totalHearings')}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'info.light',
              color: 'info.contrastText',
            }}
          >
            <DescriptionIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4">{stats?.totalDocuments || 0}</Typography>
            <Typography variant="subtitle1">{t('totalDocuments')}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'warning.light',
              color: 'warning.contrastText',
            }}
          >
            <MoneyIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4">{stats?.totalInvoices || 0}</Typography>
            <Typography variant="subtitle1">{t('totalInvoices')}</Typography>
          </Paper>
        </Grid>
        
        {/* Recent Cases */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={t('recentCases')} />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ width: '100%', maxHeight: 320, overflow: 'auto' }}>
                {stats?.recentCases && stats.recentCases.length > 0 ? (
                  stats.recentCases.map((caseItem) => (
                    <React.Fragment key={caseItem.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            <GavelIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={caseItem.title}
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {caseItem.caseNumber} - {caseItem.court}
                              </Typography>
                              <br />
                              {caseItem.nextHearingDate && (
                                <>
                                  {t('nextHearing')}: {format(new Date(caseItem.nextHearingDate), 'PPP')}
                                  <br />
                                </>
                              )}
                              <Chip
                                label={caseItem.status}
                                size="small"
                                color={
                                  caseItem.status === 'active'
                                    ? 'success'
                                    : caseItem.status === 'pending'
                                    ? 'warning'
                                    : 'default'
                                }
                                sx={{ mt: 1 }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary={t('noCases')} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Upcoming Hearings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={t('upcomingHearings')} />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ width: '100%', maxHeight: 320, overflow: 'auto' }}>
                {stats?.upcomingHearings && stats.upcomingHearings.length > 0 ? (
                  stats.upcomingHearings.map((hearing) => (
                    <React.Fragment key={hearing.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            <EventIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={hearing.caseTitle}
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {format(new Date(hearing.date), 'PPP')} at {hearing.time}
                              </Typography>
                              <br />
                              {hearing.court}
                              <br />
                              {t('purpose')}: {hearing.purpose}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary={t('noHearings')} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Cases by Type */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={t('casesByType')} />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.casesByType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="type"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats?.casesByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, t('cases')]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Revenue by Month */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={t('revenueByMonth')} />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.revenueByMonth || []}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, t('revenue')]} />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name={t('revenue') || 'Revenue'} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common', 'dashboard'])),
    },
  };
};

export default Dashboard;