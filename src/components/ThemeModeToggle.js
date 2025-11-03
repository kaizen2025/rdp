import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeModeContext';

/**
 * Bouton toggle mode sombre/clair
 * À intégrer dans MainLayout ou Header
 */
const ThemeModeToggle = () => {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Tooltip title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}>
      <IconButton onClick={toggleMode} color="inherit">
        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeModeToggle;
