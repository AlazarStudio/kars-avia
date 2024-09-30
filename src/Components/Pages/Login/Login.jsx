import React, { useState } from "react";
import { Button, TextField, Box, Typography, Container, Alert } from "@mui/material";

import { SINGIN } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

function Login() {
    const [signIn] = useMutation(SINGIN);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let response_signIn = await signIn({
                variables: {
                    input: {
                        login: username,
                        password: password
                    }
                }
            });

            let token = response_signIn && response_signIn.data.signIn.token;

            // document.cookie = `token=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`; // когда будет https и заливать куки из сервака
            document.cookie = `token=${token}; SameSite=Lax; Max-Age=86400`;

            navigate("/");
            window.location.reload()
        } catch (err) {
            setError("Ошибка авторизации. Проверьте логин или пароль.");
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
                    Вход в CRM Kars Avia
                </Typography>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Имя пользователя"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Пароль"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 2, height: '50px', fontWeight: 'bold' }}
                    >
                        Войти
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default Login;
