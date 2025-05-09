import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  TextField,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Book as BookIcon,
  Gavel as GavelIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import Layout from '@/components/layout/Layout';
import AILegalAssistant from '@/components/legal-research/AILegalAssistant';
import { AppDispatch } from '@/store/store';
import {
  fetchResearches,
  selectResearches,
  selectResearchLoading,
  createResearch,
} from '@/store/slices/legalResearchSlice';

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
      id={`legal-research-tabpanel-${index}`}
      aria-labelledby={`legal-research-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `legal-research-tab-${index}`,
    'aria-controls': `legal-research-tabpanel-${index}`,
  };
}

const LegalResearchPage: React.FC = () => {
  const { t } = useTranslation(['legal-research', 'common']);
  const dispatch = useDispatch<AppDispatch>();
  const researches = useSelector(selectResearches);
  const loading = useSelector(selectResearchLoading);
  
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Dispatch search action
    }
  };
  
  const handleSaveResearch = (data: { question: string; answer: string; citations: any[] }) => {
    dispatch(createResearch({
      title: data.question.substring(0, 100),
      query: data.question,
      notes: `AI Response: ${data.answer.substring(0, 200)}...`,
    }));
  };
  
  return (
    <Layout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 120px)' }}>
        <Typography variant="h4" gutterBottom>
          {t('legalResearch', { ns: 'legal-research' })}
        </Typography>
        
        <Paper sx={{ width: '100%', height: 'calc(100% - 50px)' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="legal research tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={t('aiAssistant', { ns: 'legal-research' })} {...a11yProps(0)} />
            <Tab label={t('searchDatabase', { ns: 'legal-research' })} {...a11yProps(1)} />
            <Tab label={t('savedResearches', { ns: 'legal-research' })} {...a11yProps(2)} />
            <Tab label={t('caseAnalysis', { ns: 'legal-research' })} {...a11yProps(3)} />
          </Tabs>
          
          <Box sx={{ height: 'calc(100% - 48px)' }}>
            {/* AI Assistant Tab */}
            <TabPanel value={tabValue} index={0}>
              <AILegalAssistant onSaveResearch={handleSaveResearch} />
            </TabPanel>
            
            {/* Search Database Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label={t('searchQuery', { ns: 'legal-research' })}
                      placeholder={t('enterSearchQuery', { ns: 'legal-research' }) || 'Enter search query...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={handleSearch}>
                            <SearchIcon />
                          </IconButton>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={handleSearch}
                        fullWidth
                      >
                        {t('search', { ns: 'common' })}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<BookmarkIcon />}
                        fullWidth
                      >
                        {t('saveSearch', { ns: 'legal-research' })}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                {t('searchFilters', { ns: 'legal-research' })}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label={t('court', { ns: 'legal-research' })}
                    select
                    SelectProps={{ native: true }}
                  >
                    <option value="">{t('allCourts', { ns: 'legal-research' })}</option>
                    <option value="supreme">Supreme Court</option>
                    <option value="high">High Courts</option>
                    <option value="district">District Courts</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label={t('jurisdiction', { ns: 'legal-research' })}
                    select
                    SelectProps={{ native: true }}
                  >
                    <option value="">{t('allJurisdictions', { ns: 'legal-research' })}</option>
                    <option value="civil">Civil</option>
                    <option value="criminal">Criminal</option>
                    <option value="tax">Tax</option>
                    <option value="corporate">Corporate</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label={t('dateRange', { ns: 'legal-research' })}
                    select
                    SelectProps={{ native: true }}
                  >
                    <option value="">{t('allTime', { ns: 'legal-research' })}</option>
                    <option value="1">Last 1 year</option>
                    <option value="5">Last 5 years</option>
                    <option value="10">Last 10 years</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label={t('source', { ns: 'legal-research' })}
                    select
                    SelectProps={{ native: true }}
                  >
                    <option value="">{t('allSources', { ns: 'legal-research' })}</option>
                    <option value="scc">SCC Online</option>
                    <option value="manupatra">Manupatra</option>
                    <option value="indiankanoon">Indian Kanoon</option>
                  </TextField>
                </Grid>
              </Grid>
              
              <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
                {t('searchPrompt', { ns: 'legal-research' })}
              </Typography>
            </TabPanel>
            
            {/* Saved Researches Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs>
                    <Typography variant="h6">
                      {t('savedResearches', { ns: 'legal-research' })}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setTabValue(0)}
                    >
                      {t('newResearch', { ns: 'legal-research' })}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                {researches.length > 0 ? (
                  researches.map((research: any) => (
                    <Grid item xs={12} md={6} lg={4} key={research.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1" noWrap>
                              {research.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={new Date(research.createdAt).toLocaleDateString()}
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {research.query.substring(0, 100)}
                            {research.query.length > 100 ? '...' : ''}
                          </Typography>
                          {research.notes && (
                            <Typography variant="body2" color="text.secondary">
                              {research.notes.substring(0, 100)}
                              {research.notes.length > 100 ? '...' : ''}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions>
                          <Tooltip title={t('view', { ns: 'common' })}>
                            <IconButton size="small">
                              <SearchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('share', { ns: 'common' })}>
                            <IconButton size="small">
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('delete', { ns: 'common' })}>
                            <IconButton size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        {t('noSavedResearches', { ns: 'legal-research' })}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setTabValue(0)}
                        sx={{ mt: 2 }}
                      >
                        {t('startNewResearch', { ns: 'legal-research' })}
                      </Button>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </TabPanel>
            
            {/* Case Analysis Tab */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('caseAnalysis', { ns: 'legal-research' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('caseAnalysisDescription', { ns: 'legal-research' })}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t('uploadCaseDocuments', { ns: 'legal-research' })}
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 3,
                        textAlign: 'center',
                        mb: 2,
                      }}
                    >
                      <DocumentIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('dragDropFiles', { ns: 'legal-research' })}
                      </Typography>
                      <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                        {t('browseFiles', { ns: 'legal-research' })}
                      </Button>
                    </Box>
                    <Button variant="contained" fullWidth>
                      {t('analyzeDocuments', { ns: 'legal-research' })}
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t('predictOutcome', { ns: 'legal-research' })}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label={t('caseFacts', { ns: 'legal-research' })}
                      placeholder={t('enterCaseFacts', { ns: 'legal-research' }) || 'Enter case facts...'}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label={t('legalIssues', { ns: 'legal-research' })}
                      placeholder={t('enterLegalIssues', { ns: 'legal-research' }) || 'Enter legal issues...'}
                      sx={{ mb: 2 }}
                    />
                    <Button variant="contained" fullWidth>
                      {t('predictOutcome', { ns: 'legal-research' })}
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', [
        'common',
        'legal-research',
      ])),
    },
  };
};

export default LegalResearchPage;