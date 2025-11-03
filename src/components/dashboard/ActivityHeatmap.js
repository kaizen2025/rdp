import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';

/**
 * Carte thermique d'activité par heure et jour de la semaine
 * Affiche visuellement les pics d'activité
 */
const ActivityHeatmap = ({ data = [] }) => {
  const [selectedMetric, setSelectedMetric] = useState('sessions');
  
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Générer des données de démonstration si pas de données réelles
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    if (data.length > 0) {
      // Traiter les vraies données
      const processed = processActivityData(data, selectedMetric);
      setHeatmapData(processed);
    } else {
      // Données de démonstration
      const demoData = generateDemoData();
      setHeatmapData(demoData);
    }
  }, [data, selectedMetric]);

  const processActivityData = (rawData, metric) => {
    // Initialiser la grille 7 jours x 24 heures
    const grid = Array(7).fill(null).map(() => Array(24).fill(0));

    rawData.forEach(entry => {
      if (entry.timestamp && entry[metric]) {
        const date = new Date(entry.timestamp);
        const day = (date.getDay() + 6) % 7; // Lundi = 0
        const hour = date.getHours();
        grid[day][hour] += entry[metric];
      }
    });

    return grid;
  };

  const generateDemoData = () => {
    const grid = Array(7).fill(null).map(() => Array(24).fill(0));
    
    // Simuler activité professionnelle (8h-18h, Lun-Ven)
    for (let day = 0; day < 5; day++) {
      for (let hour = 8; hour < 18; hour++) {
        const baseActivity = Math.floor(Math.random() * 50) + 30;
        const lunchDip = hour >= 12 && hour <= 13 ? -15 : 0;
        grid[day][hour] = Math.max(0, baseActivity + lunchDip);
      }
    }

    return grid;
  };

  const getMaxValue = () => {
    let max = 0;
    heatmapData.forEach(row => {
      row.forEach(val => {
        if (val > max) max = val;
      });
    });
    return max || 1;
  };

  const getColor = (value) => {
    if (value === 0) return '#f0f0f0';
    
    const maxValue = getMaxValue();
    const intensity = value / maxValue;
    
    // Gradient de couleur : vert clair -> vert foncé -> orange -> rouge
    if (intensity < 0.25) {
      const green = Math.floor(200 + intensity * 4 * 55);
      return `rgb(180, ${green}, 180)`;
    } else if (intensity < 0.5) {
      const greenToYellow = (intensity - 0.25) * 4;
      return `rgb(${Math.floor(180 + greenToYellow * 75)}, 220, ${Math.floor(180 - greenToYellow * 180)})`;
    } else if (intensity < 0.75) {
      const yellowToOrange = (intensity - 0.5) * 4;
      return `rgb(255, ${Math.floor(220 - yellowToOrange * 80)}, 0)`;
    } else {
      const orangeToRed = (intensity - 0.75) * 4;
      return `rgb(255, ${Math.floor(140 - orangeToRed * 140)}, 0)`;
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Carte thermique d'activité
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Métrique</InputLabel>
          <Select
            value={selectedMetric}
            label="Métrique"
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            <MenuItem value="sessions">Sessions</MenuItem>
            <MenuItem value="users">Utilisateurs</MenuItem>
            <MenuItem value="loans">Prêts</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'flex', minWidth: 700 }}>
          {/* Colonne des jours */}
          <Box sx={{ mr: 1 }}>
            <Box sx={{ height: 30 }} /> {/* Espace pour les heures */}
            {daysOfWeek.map((day, index) => (
              <Box
                key={index}
                sx={{
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  pr: 1
                }}
              >
                {day}
              </Box>
            ))}
          </Box>

          {/* Grille des heures */}
          <Box sx={{ flex: 1 }}>
            {/* En-tête des heures */}
            <Box sx={{ display: 'flex', mb: 0.5 }}>
              {hours.map(hour => (
                <Box
                  key={hour}
                  sx={{
                    flex: 1,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: 'text.secondary'
                  }}
                >
                  {hour}h
                </Box>
              ))}
            </Box>

            {/* Cellules de la heatmap */}
            {heatmapData.map((dayData, dayIndex) => (
              <Box key={dayIndex} sx={{ display: 'flex', mb: 0.5 }}>
                {dayData.map((value, hourIndex) => (
                  <Tooltip
                    key={hourIndex}
                    title={`${daysOfWeek[dayIndex]} ${hourIndex}h: ${value} ${selectedMetric}`}
                    arrow
                  >
                    <Box
                      sx={{
                        flex: 1,
                        height: 30,
                        backgroundColor: getColor(value),
                        border: '1px solid white',
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          zIndex: 10,
                          boxShadow: 2
                        }
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Légende */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="caption" sx={{ mr: 1 }}>
          Faible
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
            <Box
              key={intensity}
              sx={{
                width: 30,
                height: 15,
                backgroundColor: getColor(intensity * getMaxValue()),
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
          ))}
        </Box>
        <Typography variant="caption" sx={{ ml: 1 }}>
          Élevée
        </Typography>
      </Box>
    </Box>
  );
};

export default ActivityHeatmap;
