import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { authClient } from '../custom/authClient';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Snackbar,
  Alert,
  AlertColor,
  useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RecoverPasswordFields } from '../../types/form.types';
import { formSpacing } from '../../constants';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import { emailValidator } from './helpers/zod.validators';

// zod validation
const recoverPwdValidationSchema = z.object({
  email: emailValidator,
});

const RecoverPasswordContainer: React.FC = () => {
  const theme = useTheme();
  const [open, setOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<AlertColor | undefined>();
  const [message, setMessage] = useState<string>('');

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const { register, handleSubmit, formState } = useForm<RecoverPasswordFields>({
    resolver: zodResolver(recoverPwdValidationSchema),
  });

  const { errors } = formState;

  const handleRecoverPassword: SubmitHandler<RecoverPasswordFields> = async (data) => {
    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: `${window.location.origin}/password/new`,
    });

    if (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    } else {
      setStatus('success');
      setMessage('Password recovery email successfully sent! Please check your email.');
    }
    setOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          background: theme.palette.primary.darker,
          borderRadius: ['15px', '30px'],
          padding: '32px 24px',
          width: { xs: '100%', md: '50%' },
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          component={RouterLink}
          to="/"
          color="primary"
          sx={{ textDecoration: 'none' }}
          marginBottom={['0.75rem', '1.5rem']}
        >
          <ArrowBackRounded sx={{ color: theme.palette.text.primary }} />
          <Typography variant="body1" color={'text'} marginLeft={1}>
            Return to Login
          </Typography>
        </Box>
        <Stack direction={'column'} margin={'auto'} spacing={formSpacing}>
          <Stack spacing={1}>
            <Typography variant="h1" color={'text'} textAlign={'center'}>
              Recover Password
            </Typography>
          </Stack>
          <form onSubmit={handleSubmit(handleRecoverPassword)}>
            <Stack spacing={formSpacing}>
              <Stack spacing={1}>
                <Typography variant="subtitle1">Email</Typography>
                <TextField
                  {...register('email', {
                    required: 'Required',
                  })}
                  fullWidth
                  error={!!errors?.email?.message}
                  helperText={errors?.email?.message}
                />
              </Stack>
              <Typography variant={'body1'} textAlign={'left'}>
                Please enter the email on your account and we'll send you a link to reset your
                password.
              </Typography>
              <Button
                type={'submit'}
                color={'secondary'}
                sx={{ borderRadius: '30px' }}
                variant={'contained'}
                fullWidth
              >
                <Typography variant="subtitle1">Send Recovery Link</Typography>
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
      <Snackbar
        open={open}
        onClose={handleClose}
        autoHideDuration={9000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={status} sx={{ width: '100%' }} onClose={handleClose}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RecoverPasswordContainer;
