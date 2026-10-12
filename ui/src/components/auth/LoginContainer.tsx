import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { authClient } from '../custom/authClient';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoginFormFields } from '../../types/form.types';
import { formSpacing } from '../../constants';
import { emailValidator, passwordValidator } from './helpers/zod.validators';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';

// zod validation
const loginValidationSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
});

const GENERIC_LOGIN_ERROR = 'Could not log in. Please try again.';

const getLoginErrorMessage = (status: number) =>
  status === 401 ? 'Invalid email or wrong password' : GENERIC_LOGIN_ERROR;

const LoginContainer: React.FC = () => {
  const { register, handleSubmit, formState } = useForm<LoginFormFields>({
    resolver: zodResolver(loginValidationSchema),
  });
  const { errors } = formState;

  const [invalidLogin, setInvalidLogin] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const redirectFrom: unknown = location.state?.from;
  const redirectPath = typeof redirectFrom === 'string' ? redirectFrom : '/';

  const handleEmailLogin: SubmitHandler<LoginFormFields> = async (data) => {
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password ?? '',
    });
    if (error) {
      setInvalidLogin(getLoginErrorMessage(error.status));
      return;
    }
    setInvalidLogin('');
    navigate(redirectPath);
  };

  const handleGoogleLogin = async () => {
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/api/auth-callback?next=${encodeURIComponent(
        redirectPath
      )}`,
    });
    if (error) {
      setInvalidLogin(GENERIC_LOGIN_ERROR);
    }
  };

  return (
    <Box
      sx={{
        background: theme.palette.primary.darker,
        width: { xs: '100%', md: '50%' },
        borderRadius: ['15px', '30px'],
        padding: '32px 24px',
      }}
    >
      <Stack direction={'column'} margin={'auto'} spacing={formSpacing}>
        <Stack spacing={0.5}>
          <Typography variant="h1" color={theme.palette.text.primary} textAlign={'center'}>
            Log In
          </Typography>
        </Stack>
        <form onSubmit={handleSubmit(handleEmailLogin)}>
          <Stack spacing={formSpacing}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" color="secondary">
                Email
              </Typography>
              <TextField
                fullWidth
                autoComplete={'email'}
                autoFocus
                {...register('email', {
                  required: 'Required',
                })}
                error={!!errors?.email?.message}
                helperText={errors?.email?.message}
              />
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle1" color="secondary">
                Password
              </Typography>
              <TextField
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Required',
                })}
                autoComplete={'current-password'}
                fullWidth
                error={!!errors?.password?.message}
                helperText={errors?.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        color="secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <Link
                component={RouterLink}
                to="/password/recover"
                textAlign="right"
                underline={'hover'}
                color="secondary"
                variant="button"
              >
                FORGOT PASSWORD?
              </Link>
            </Stack>
            {invalidLogin ? (
              <Typography variant={'body2'} color={'error'}>
                {invalidLogin}
              </Typography>
            ) : null}
            <Stack display="flex" justifyContent="center" alignItems="center" spacing={2}>
              <Button
                type={'submit'}
                sx={{ borderRadius: '30px' }}
                color={'secondary'}
                variant={'contained'}
                fullWidth
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} color="primary">
                  Log In
                </Typography>
              </Button>
              <Typography>OR</Typography>
              <Button
                onClick={handleGoogleLogin}
                variant={'outlined'}
                color={'secondary'}
                fullWidth
                startIcon={<GoogleIcon />}
                sx={{ borderRadius: '30px' }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Continue with Google
                </Typography>
              </Button>
              <Stack
                direction={'row'}
                spacing={4}
                justifyContent={'space-between'}
                alignItems={'center'}
              >
                <Typography variant="subtitle1" color={theme.palette.secondary.light}>
                  Don't have an account?
                </Typography>
                <Link
                  component={RouterLink}
                  to="/register"
                  color="secondary"
                  underline={'hover'}
                  variant="button"
                >
                  <Typography variant="subtitle1">SIGN UP</Typography>
                </Link>
              </Stack>
            </Stack>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
};

export default LoginContainer;
