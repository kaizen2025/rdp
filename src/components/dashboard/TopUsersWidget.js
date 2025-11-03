import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

/**
 * Widget Top 10 utilisateurs les plus actifs
 * Affiche les statistiques avec barres de progression
 */
const TopUsersWidget = ({ data = [], metric = 'sessions' }) => {
  const [topUsers, setTopUsers] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (data.length > 0) {
      const sorted = processUserData(data, selectedMetric, sortOrder);
      setTopUsers(sorted.slice(0, 10));
    } else {
      // Données de démonstration
      const demoUsers = generateDemoUsers();
      setTopUsers(demoUsers);
    }
  }, [data, selectedMetric, sortOrder]);

  const processUserData = (rawData, metric, order) => {
    const userMap = new Map();

    rawData.forEach(entry => {
      if (entry.user && entry[metric]) {
        const current = userMap.get(entry.user) || 0;
        userMap.set(entry.user, current + entry[metric]);
      }
    });

    const sorted = Array.from(userMap.entries())
      .map(([user, value]) => ({ user, value }))
      .sort((a, b) => order === 'desc' ? b.value - a.value : a.value - b.value);

    return sorted;
  };

  const generateDemoUsers = () => {
    const names = [
      'Marie Garcia', 'Jean Dupont', 'Sophie Martin', 'Pierre Bernard',
      'Emma Petit', 'Lucas Dubois', 'Camille Moreau', 'Thomas Laurent',
      'Julie Simon', 'Alexandre Michel'
    ];

    return names.map((name, index) => ({
      user: name,
      value: Math.floor(Math.random() * 100) + (100 - index * 8),
      trend: Math.random() > 0.5 ? 'up' : 'down',
      percentage: Math.floor(Math.random() * 30) + 5
    }));
  };

  const getMaxValue = () => {
    if (topUsers.length === 0) return 1;
    return Math.max(...topUsers.map(u => u.value));
  };

  const getProgressColor = (index) => {
    if (index === 0) return 'error'; // Or
    if (index === 1) return 'warning'; // Argent
    if (index === 2) return 'success'; // Bronze
    return 'primary';
  };

  const getMetricLabel = () => {
    const labels = {
      sessions: 'sessions',
      duration: 'heures',
      loans: 'prêts',
      actions: 'actions'
    };
    return labels[selectedMetric] || selectedMetric;
  };

  const handleMetricChange = (event, newMetric) => {
    if (newMetric !== null) {
      setSelectedMetric(newMetric);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Top 10 Utilisateurs
        </Typography>
        <ToggleButtonGroup
          value={selectedMetric}
          exclusive
          onChange={handleMetricChange}
          size="small"
        >
          <ToggleButton value="sessions">Sessions</ToggleButton>
          <ToggleButton value="duration">Durée</ToggleButton>
          <ToggleButton value="loans">Prêts</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ p: 0 }}>
          {topUsers.map((user, index) => {
            const maxValue = getMaxValue();
            const progressValue = (user.value / maxValue) * 100;

            return (
              <Paper
                key={index}
                elevation={1}
                sx={{
                  mb: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    elevation: 3,
                    transform: 'translateX(4px)',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItem>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: index < 3 ? 
                          (index === 0 ? 'error.main' : index === 1 ? 'warning.main' : 'success.main') :
                          'primary.main',
                        fontWeight: 'bold'
                      }}
                    >
                      {index < 3 ? `${index + 1}` : <PersonIcon />}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" fontWeight={index < 3 ? 'bold' : 'normal'}>
                          {user.user}
                        </Typography>
                        {user.trend && (
                          <Chip
                            icon={user.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={`${user.percentage || 0}%`}
                            size="small"
                            color={user.trend === 'up' ? 'success' : 'error'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {user.value} {getMetricLabel()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {progressValue.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progressValue}
                          color={getProgressColor(index)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              </Paper>
            );
          })}
        </List>

        {topUsers.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
              color: 'text.secondary'
            }}
          >
            <Typography>Aucune donnée disponible</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TopUsersWidget;
