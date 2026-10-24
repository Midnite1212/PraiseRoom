import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { requestUrl } from '@/test/mock-fetch';
import { renderWithQueryAndRouter } from '@/test/render-with-router';

import { AuthField } from './auth-field';
import { ResetPage } from './reset-page';
import { SignInPage } from './sign-in-page';
import { SignUpPage } from './sign-up-page';

type Call = { path: string; body: unknown };

const stubAuth = (respond: (path: string) => Response = () => new Response('{}')) => {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = requestUrl(input);
      calls.push({
        path,
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      });
      return Promise.resolve(respond(path));
    })
  );
  return calls;
};

afterEach(() => vi.unstubAllGlobals());

describe('SignInPage', () => {
  it('asks for both fields before sending anything', async () => {
    const calls = stubAuth();
    renderWithQueryAndRouter(<SignInPage redirect={undefined} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(calls).toEqual([]);
  });

  it('shows a translated message for wrong credentials, not the server text', async () => {
    stubAuth(
      () =>
        new Response(
          JSON.stringify({ code: 'INVALID_EMAIL_OR_PASSWORD', message: 'server text' }),
          {
            status: 401,
          }
        )
    );
    renderWithQueryAndRouter(<SignInPage redirect={undefined} />);
    await userEvent.type(await screen.findByLabelText('Email'), 'dummy@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'not-the-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
    expect(screen.queryByText('server text')).not.toBeInTheDocument();
  });

  it('offers Google, the reset link and the sign-up link', async () => {
    renderWithQueryAndRouter(<SignInPage redirect={undefined} />);
    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot it?' })).toHaveAttribute('href', '/forgot');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/sign-up'
    );
  });
});

describe('SignUpPage', () => {
  it('lights the strength meter hint as the password grows', async () => {
    renderWithQueryAndRouter(<SignUpPage redirect={undefined} />);
    const password = await screen.findByLabelText('Password');
    expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument();

    await userEvent.type(password, 'abc');
    expect(screen.getByText('5 more characters')).toBeInTheDocument();

    await userEvent.clear(password);
    await userEvent.type(password, 'a short sentence');
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('needs a name and a long enough password, and says teammates never see the email', async () => {
    const calls = stubAuth();
    renderWithQueryAndRouter(<SignUpPage redirect={undefined} />);
    await userEvent.type(await screen.findByLabelText('Email'), 'dummy@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Add the name your team knows you by.')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(screen.getByText('Your teammates see your name, never your email.')).toBeInTheDocument();
    expect(calls).toEqual([]);
  });
});

describe('ResetPage', () => {
  it('explains a link without a token and offers a new one', async () => {
    renderWithQueryAndRouter(<ResetPage token={undefined} />);
    expect(
      await screen.findByRole('heading', { name: 'This link has expired' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Send a new link' })).toHaveAttribute(
      'href',
      '/forgot'
    );
  });

  it('flags a mismatch on the second field', async () => {
    const calls = stubAuth();
    renderWithQueryAndRouter(<ResetPage token="reset-token" />);
    await userEvent.type(await screen.findByLabelText('New password'), 'a short sentence');
    await userEvent.type(screen.getByLabelText('Type it again'), 'something else');
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByText('The two passwords don’t match.')).toBeInTheDocument();
    expect(calls).toEqual([]);
  });

  it('sends the new password with the token from the link', async () => {
    const calls = stubAuth();
    renderWithQueryAndRouter(<ResetPage token="reset-token" />);
    await userEvent.type(await screen.findByLabelText('New password'), 'a short sentence');
    await userEvent.type(screen.getByLabelText('Type it again'), 'a short sentence');
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }));

    await waitFor(() =>
      expect(calls).toEqual([
        {
          path: '/api/auth/reset-password',
          body: { newPassword: 'a short sentence', token: 'reset-token' },
        },
      ])
    );
  });

  it('shows the expired state when the server rejects the token', async () => {
    stubAuth(() => new Response(JSON.stringify({ code: 'INVALID_TOKEN' }), { status: 400 }));
    renderWithQueryAndRouter(<ResetPage token="old-token" />);
    await userEvent.type(await screen.findByLabelText('New password'), 'a short sentence');
    await userEvent.type(screen.getByLabelText('Type it again'), 'a short sentence');
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(
      await screen.findByRole('heading', { name: 'This link has expired' })
    ).toBeInTheDocument();
  });
});

describe('AuthField', () => {
  it('shows and hides a password, and names the error on the input', async () => {
    renderWithQueryAndRouter(
      <AuthField
        id="pw"
        type="password"
        label="Password"
        autoComplete="current-password"
        value="secret-value"
        error="Nope"
        onChange={() => undefined}
      />
    );
    const input = await screen.findByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent('Nope');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
