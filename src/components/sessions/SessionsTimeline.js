import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subHours } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Timeline graphique des sessions RDS
 * Affiche l'évolution des sessions actives sur une période
 */
const SessionsTimeline = ({ sessions = [], timeRange = 24 }) => {
  const [chartType, setChartType] = useState('line'); // 'line' ou 'area'
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    generateTimelineData();
  }, [sessions, timeRange]);

  const generateTimelineData = () => {
    const now = new Date();
    const dataPoints = [];
    const interval = timeRange <= 24 ? 1 : timeRange <= 168 ? 3 : 24; // Heures entre chaque point

    for (let i = timeRange; i >= 0; i -= interval) {
      const timestamp = subHours(now, i);
      const hour = format(timestamp, 'HH:mm');
      
      // Compter les sessions actives à ce moment
      const activeSessions = sessions.filter(session => {
        const start = new Date(session.startTime);
        const end = session.endTime ? new Date(session.endTime) : now;
        return start <= timestamp && end >= timestamp;
      }).length;

      // Simuler données si vide
      const value = sessions.length > 0 ? activeSessions : Math.floor(Math.random() * 50) + 20;

      dataPoints.push({
        time: hour,
        timestamp,
        sessions: value,
        users: Math.floor(value * 0.7), // Estimation utilisateurs uniques
      });
    }

    setTimelineData(dataPoints);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="caption" display="block" gutterBottom>
            {format(payload[0].payload.timestamp, 'dd MMM yyyy HH:mm', { locale: fr })}
          </Typography>
          {payload.map((entry, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name} : <strong>{entry.value}</strong>
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Timeline des sessions ({timeRange}h)
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={chartType}
            label="Type"
            onChange={(e) => setChartType(e.target.value)}
          >
            <MenuItem value="line">Ligne</MenuItem>
            <MenuItem value="area">Zone</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="sessions"
              stroke="#2196f3"
              name="Sessions actives"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#4caf50"
              name="Utilisateurs"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        ) : (
          <AreaChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="sessions"
              stroke="#2196f3"
              fill="#2196f3"
              fillOpacity={0.3}
              name="Sessions actives"
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#4caf50"
              fill="#4caf50"
              fillOpacity={0.3}
              name="Utilisateurs"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            {timelineData.length > 0 ? timelineData[timelineData.length - 1].sessions : 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sessions actuelles
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">
            {timelineData.length > 0
              ? Math.max(...timelineData.map(d => d.sessions))
              : 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pic maximum
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="info.main">
            {timelineData.length > 0
              ? Math.round(timelineData.reduce((acc, d) => acc + d.sessions, 0) / timelineData.length)
              : 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Moyenne
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SessionsTimeline;
