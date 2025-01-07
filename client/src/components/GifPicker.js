import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    ImageList,
    ImageListItem,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useDebounce } from '../hooks/useDebounce';
import api from '../services/api';

export default function GifPicker({ open, onClose, onSelect }) {
    const [search, setSearch] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        if (!open) return;

      const fetchTrending = async () => {
          try {
              setLoading(true);
              const response = await api.get('/giphy/trending');
              setGifs(response.data.data);
      } catch (error) {
          console.error('Error fetching trending GIFs:', error);
      } finally {
          setLoading(false);
      }
    };

      if (!debouncedSearch) {
          fetchTrending();
      }
  }, [open, debouncedSearch]);

    useEffect(() => {
        if (!debouncedSearch) return;

      const searchGifs = async () => {
          try {
              setLoading(true);
              const response = await api.get('/giphy/search', {
                  params: { q: debouncedSearch }
              });
              setGifs(response.data.data);
          } catch (error) {
              console.error('Error searching GIFs:', error);
          } finally {
              setLoading(false);
          }
    };

      searchGifs();
  }, [debouncedSearch]);

    const handleSelect = (gif) => {
        onSelect({
            id: gif.id,
            url: gif.images.original.url,
            title: gif.title,
            preview: gif.images.fixed_height.url
    });
      onClose();
  };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='md'
            fullWidth
            PaperProps={{
                sx: { height: '80vh' }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        fullWidth
                        placeholder='Search GIFs...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                    <IconButton onClick={onClose} edge='end'>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%'
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <ImageList cols={3} gap={8}>
                        {gifs.map((gif) => (
                            <ImageListItem
                                key={gif.id}
                                onClick={() => handleSelect(gif)}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        opacity: 0.8
                                    }
                                }}
                            >
                                <img
                                    src={gif.images.fixed_height.url}
                                    alt={gif.title}
                                    loading='lazy'
                                    style={{
                                        borderRadius: 4,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </ImageListItem>
            ))}
                  </ImageList>
              )}
          </DialogContent>
      </Dialog>
  );
}
