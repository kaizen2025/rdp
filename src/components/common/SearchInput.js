// src/components/common/SearchInput.js - Input de recherche avec debounce

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

/**
 * SearchInput - Input de recherche moderne avec debounce
 *
 * @param {string} value - Valeur actuelle
 * @param {Function} onChange - Callback avec la valeur debounced
 * @param {string} placeholder - Placeholder
 * @param {number} debounceDelay - Délai de debounce en ms (default: 300)
 * @param {boolean} autoFocus - Auto-focus au montage
 * @param {string} size - Taille du champ ('small', 'medium')
 * @param {boolean} fullWidth - Prend toute la largeur
 */
const SearchInput = ({
    value: controlledValue,
    onChange,
    placeholder = 'Rechercher...',
    debounceDelay = 300,
    autoFocus = false,
    size = 'small',
    fullWidth = false,
    disabled = false,
    sx = {},
}) => {
    const [internalValue, setInternalValue] = useState(controlledValue || '');
    const inputRef = useRef(null);
    const timeoutRef = useRef(null);

    // Mettre à jour la valeur interne quand la valeur contrôlée change
    useEffect(() => {
        setInternalValue(controlledValue || '');
    }, [controlledValue]);

    // Debounce de la recherche
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (onChange) {
                onChange(internalValue);
            }
        }, debounceDelay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [internalValue, debounceDelay, onChange]);

    const handleChange = useCallback((event) => {
        setInternalValue(event.target.value);
    }, []);

    const handleClear = useCallback(() => {
        setInternalValue('');
        if (onChange) {
            onChange('');
        }
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [onChange]);

    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            handleClear();
        }
    }, [handleClear]);

    return (
        <TextField
            inputRef={inputRef}
            value={internalValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            size={size}
            fullWidth={fullWidth}
            disabled={disabled}
            sx={sx}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon color="action" />
                    </InputAdornment>
                ),
                endAdornment: internalValue && (
                    <InputAdornment position="end">
                        <Tooltip title="Effacer (Échap)">
                            <IconButton
                                size="small"
                                onClick={handleClear}
                                edge="end"
                            >
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </InputAdornment>
                ),
            }}
        />
    );
};

export default SearchInput;
