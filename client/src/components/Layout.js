import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/login');
    };

    const handleProfile = () => {
        handleClose();
        // TODO: Implement profile page navigation
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position='static'>
                <Toolbar>
                    <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
                        Secure Chat
                    </Typography>
                    <div>
                        <IconButton
                            size='large'
                            aria-label='account of current user'
                            aria-controls='menu-appbar'
                            aria-haspopup='true'
                            onClick={handleMenu}
                            color='inherit'
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            id='menu-appbar'
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right'
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right'
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={handleProfile}>Profile ({user?.username})</MenuItem>
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </div>
                </Toolbar>
            </AppBar>
            <Container component='main' sx={{ flexGrow: 1, py: 3 }}>
                {children}
            </Container>
        </Box>
    );
}

export default Layout;
