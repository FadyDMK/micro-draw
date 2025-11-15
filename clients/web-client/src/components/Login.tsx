import { useState, type FormEvent } from "react";
import { authService } from "../utils/api";
import '../styles/Login.css';

interface LoginProps {
    onLogin: (token: string, userId: string, username: string) => void;
}

function Login({ onLogin }: LoginProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegister) {
                await authService.register(username, password);
            }
            const { token, user } = await authService.login(username, password);
            onLogin(token, user.id, user.username);
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-wrapper">
                <h1>Micro Draw</h1>
                <p className="subtitle">
                    {isRegister ? "Register a new account" : "Login to your account!"}
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            placeholder="Enter Username"
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            placeholder="Enter Password"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />

                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="button-group">
                        <button type="submit" disabled={loading} className="submit-button">
                            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
                        </button>
                        <button
                            type="button"
                            className="toggle-button"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                            }}
                            disabled={loading}
                        >
                            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                        </button>
                    </div>
                </form>
            </div>
        </div>

    )
}

export default Login;
