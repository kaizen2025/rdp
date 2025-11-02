// src/components/ad-tree/AdTreeView.js - Arborescence hiérarchique Active Directory

import React, { useState, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Collapse,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Chip,
    CircularProgress,
    TextField,
    InputAdornment,
    Badge
} from '@mui/material';
import {
    ExpandMore,
    ChevronRight,
    Folder,
    FolderOpen,
    Group as GroupIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Search as SearchIcon,
    Close as CloseIcon
} from '@mui/icons-material';

/**
 * Composant TreeNode pour afficher un nœud de l'arborescence
 */
const TreeNode = ({ node, level = 0, onNodeClick, onExpand, expandedNodes, searchTerm }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const handleToggle = (e) => {
        e.stopPropagation();
        onExpand(node.id);
    };

    const handleClick = () => {
        onNodeClick(node);
    };

    // Filtrer les enfants si recherche active
    const filteredChildren = useMemo(() => {
        if (!node.children || !searchTerm) return node.children;

        const filterNodes = (nodes) => {
            return nodes.filter(child => {
                const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase());
                const hasMatchingChildren = child.children && filterNodes(child.children).length > 0;
                return matchesSearch || hasMatchingChildren;
            });
        };

        return filterNodes(node.children);
    }, [node.children, searchTerm]);

    // Déterminer l'icône selon le type
    const getIcon = () => {
        switch (node.type) {
            case 'ou':
            case 'container':
                return isExpanded ? <FolderOpen color="warning" /> : <Folder color="action" />;
            case 'group':
                return <GroupIcon color="primary" />;
            case 'user':
                return <PersonIcon color="secondary" />;
            case 'domain':
                return <BusinessIcon color="error" />;
            default:
                return <Folder color="action" />;
        }
    };

    // Mettre en évidence le terme de recherche
    const highlightText = (text) => {
        if (!searchTerm) return text;

        const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
        if (index === -1) return text;

        return (
            <>
                {text.substring(0, index)}
                <Box component="span" sx={{ backgroundColor: 'warning.light', fontWeight: 'bold' }}>
                    {text.substring(index, index + searchTerm.length)}
                </Box>
                {text.substring(index + searchTerm.length)}
            </>
        );
    };

    return (
        <>
            <ListItemButton
                onClick={handleClick}
                sx={{
                    pl: level * 3 + 2,
                    py: 0.5,
                    '&:hover': {
                        backgroundColor: 'action.hover'
                    }
                }}
            >
                {hasChildren && (
                    <IconButton
                        size="small"
                        onClick={handleToggle}
                        sx={{ mr: 0.5, p: 0.5 }}
                    >
                        {isExpanded ? <ExpandMore /> : <ChevronRight />}
                    </IconButton>
                )}

                {!hasChildren && <Box sx={{ width: 32 }} />}

                <ListItemIcon sx={{ minWidth: 36 }}>
                    {getIcon()}
                </ListItemIcon>

                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                                {highlightText(node.name)}
                            </Typography>
                            {node.memberCount > 0 && (
                                <Chip
                                    label={node.memberCount}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.7rem' }}
                                />
                            )}
                        </Box>
                    }
                    secondary={node.description}
                    secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                />

                {node.type && (
                    <Chip
                        label={node.type.toUpperCase()}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                )}
            </ListItemButton>

            {hasChildren && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {filteredChildren.map((child) => (
                            <TreeNode
                                key={child.id}
                                node={child}
                                level={level + 1}
                                onNodeClick={onNodeClick}
                                onExpand={onExpand}
                                expandedNodes={expandedNodes}
                                searchTerm={searchTerm}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

/**
 * Génère des données d'arborescence de démonstration
 */
const generateDemoTree = () => {
    return {
        id: 'dc=anecoop,dc=local',
        name: 'Anecoop.local',
        type: 'domain',
        children: [
            {
                id: 'ou=users',
                name: 'Utilisateurs',
                type: 'ou',
                children: [
                    {
                        id: 'ou=it',
                        name: 'Service IT',
                        type: 'ou',
                        description: 'Personnel informatique',
                        children: [
                            { id: 'user1', name: 'Admin IT', type: 'user' },
                            { id: 'user2', name: 'Technicien 1', type: 'user' },
                            { id: 'user3', name: 'Technicien 2', type: 'user' }
                        ]
                    },
                    {
                        id: 'ou=commercial',
                        name: 'Service Commercial',
                        type: 'ou',
                        description: 'Équipe commerciale',
                        children: [
                            { id: 'user4', name: 'Commercial 1', type: 'user' },
                            { id: 'user5', name: 'Commercial 2', type: 'user' }
                        ]
                    },
                    {
                        id: 'ou=finance',
                        name: 'Service Finance',
                        type: 'ou',
                        description: 'Comptabilité et finance',
                        children: [
                            { id: 'user6', name: 'Comptable', type: 'user' }
                        ]
                    }
                ]
            },
            {
                id: 'ou=groups',
                name: 'Groupes',
                type: 'ou',
                children: [
                    {
                        id: 'cn=vpn',
                        name: 'VPN',
                        type: 'group',
                        description: 'Accès VPN',
                        memberCount: 45
                    },
                    {
                        id: 'cn=internet',
                        name: 'Sortants_responsables',
                        type: 'group',
                        description: 'Accès Internet',
                        memberCount: 38
                    },
                    {
                        id: 'cn=admins',
                        name: 'Administrateurs',
                        type: 'group',
                        description: 'Droits administrateurs',
                        memberCount: 5
                    },
                    {
                        id: 'cn=rds-users',
                        name: 'RDS Users',
                        type: 'group',
                        description: 'Utilisateurs RDS',
                        memberCount: 120
                    }
                ]
            },
            {
                id: 'ou=computers',
                name: 'Ordinateurs',
                type: 'ou',
                description: 'Postes de travail',
                children: [
                    { id: 'comp1', name: 'PC-IT-001', type: 'computer' },
                    { id: 'comp2', name: 'PC-IT-002', type: 'computer' },
                    { id: 'comp3', name: 'LAPTOP-COM-001', type: 'computer' }
                ]
            }
        ]
    };
};

/**
 * Composant principal AdTreeView
 */
const AdTreeView = ({
    data,
    onNodeSelect,
    title = "Arborescence Active Directory",
    loading = false
}) => {
    const [expandedNodes, setExpandedNodes] = useState(new Set(['dc=anecoop,dc=local', 'ou=users', 'ou=groups']));
    const [selectedNode, setSelectedNode] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Utiliser les données de démo si aucune donnée fournie
    const treeData = data || generateDemoTree();

    const handleExpand = useCallback((nodeId) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    const handleNodeClick = useCallback((node) => {
        setSelectedNode(node);
        if (onNodeSelect) {
            onNodeSelect(node);
        }
    }, [onNodeSelect]);

    const handleExpandAll = () => {
        const allIds = new Set();
        const collectIds = (node) => {
            allIds.add(node.id);
            if (node.children) {
                node.children.forEach(collectIds);
            }
        };
        collectIds(treeData);
        setExpandedNodes(allIds);
    };

    const handleCollapseAll = () => {
        setExpandedNodes(new Set([treeData.id]));
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    return (
        <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        {title}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Tout déplier">
                        <IconButton size="small" onClick={handleExpandAll}>
                            <ExpandMore />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Tout replier">
                        <IconButton size="small" onClick={handleCollapseAll}>
                            <ChevronRight />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Search */}
            <TextField
                size="small"
                fullWidth
                placeholder="Rechercher dans l'arborescence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={clearSearch}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />

            {/* Selected node info */}
            {selectedNode && (
                <Box
                    sx={{
                        p: 1.5,
                        mb: 2,
                        backgroundColor: 'primary.lighter',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'primary.main'
                    }}
                >
                    <Typography variant="caption" color="text.secondary" display="block">
                        Sélectionné:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                        {selectedNode.name}
                    </Typography>
                    {selectedNode.description && (
                        <Typography variant="caption" color="text.secondary">
                            {selectedNode.description}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Tree */}
            <Box sx={{ flex: 1, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List component="nav" dense>
                        <TreeNode
                            node={treeData}
                            onNodeClick={handleNodeClick}
                            onExpand={handleExpand}
                            expandedNodes={expandedNodes}
                            searchTerm={searchTerm}
                        />
                    </List>
                )}
            </Box>
        </Paper>
    );
};

export default AdTreeView;
