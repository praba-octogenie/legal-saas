import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';

const ListItemLink = ({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) => {
  const router = useRouter();
  const isActive = router.pathname === href || router.pathname.startsWith(`${href}/`);

  return (
    <ListItemButton
      selected={isActive}
      onClick={() => router.push(href)}
      sx={{
        '&.Mui-selected': {
          backgroundColor: 'primary.light',
          '&:hover': {
            backgroundColor: 'primary.light',
          },
        },
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text} />
    </ListItemButton>
  );
};

export const MainListItems = () => {
  const { t } = useTranslation('common');

  return (
    <React.Fragment>
      <ListItemLink href="/dashboard" icon={<DashboardIcon />} text={t('dashboard')} />
      <ListItemLink href="/clients" icon={<PeopleIcon />} text={t('clients')} />
      <ListItemLink href="/cases" icon={<GavelIcon />} text={t('cases')} />
      <ListItemLink href="/documents" icon={<DescriptionIcon />} text={t('documents')} />
      <ListItemLink href="/court-proceedings" icon={<EventIcon />} text={t('courtProceedings')} />
      <ListItemLink href="/legal-research" icon={<SearchIcon />} text={t('legalResearch')} />
      <ListItemLink href="/billing" icon={<ReceiptIcon />} text={t('billing')} />
      <ListItemLink href="/communication" icon={<MessageIcon />} text={t('communication')} />
    </React.Fragment>
  );
};

export const SecondaryListItems = () => {
  const { t } = useTranslation('common');

  return (
    <React.Fragment>
      <ListSubheader component="div" inset>
        {t('more')}
      </ListSubheader>
      <ListItemLink href="/reports" icon={<BarChartIcon />} text={t('reports')} />
      <ListItemLink href="/settings" icon={<SettingsIcon />} text={t('settings')} />
      <ListItemLink href="/help" icon={<HelpIcon />} text={t('help')} />
    </React.Fragment>
  );
};

export const mainListItems = <MainListItems />;
export const secondaryListItems = <SecondaryListItems />;