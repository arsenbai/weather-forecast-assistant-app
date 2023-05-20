import React, { useState } from 'react';
import axios from 'axios';

const RegistrationForm = ({registrationIsInProgress, setRegistrationIsInProgress}) => {
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  // loading status handlers
  const handleRegistrationLoadStart = () => {
    setRegistrationIsInProgress(true)
  };
  const handleRegistrationLoadEnd = () => {
    setRegistrationIsInProgress(false)
  };

  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if password and confirm password match
    if (password !== confirmPassword) {
        console.error('Passwords do not match');
        return;
    }

    try {
        // Perform registration
        handleRegistrationLoadStart();

        const response = await axios.post('http://localhost:8000/signup', {
            email,
            city,
            password,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(() => {
            handleRegistrationLoadEnd()
        })

        console.log('Registration successful:', response.data);

        // set show

        // Reset form fields
        setEmail('');
        setCity('');
        setPassword('');
        setConfirmPassword('');
        
    } catch (error) {
        console.error('Registration failed:', error);
    }

    // Perform registration logic here
    // console.log('Registration form submitted');
    // console.log('Email:', email);
    // console.log('Password:', password);
    // console.log('Confirm Password:', confirmPassword);

  };

  const handleClear = () => {
    // Reset form fields
    setEmail('');
    setCity('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <>
    <div style={{
        display: "flex",
        justifyContent: "center"
    }}>
        <div style={{
            maxHeight: "75vh",
            maxwidth: "75vw",
            width: "25rem"
        }}>
            <h2>Registration Form</h2>
            <form onSubmit={handleSubmit} style={{
                padding: "1rem",
                height: "10rem", 
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
                }}>

                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem"
                }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        placeholder="Enter existing email"
                        value={email}
                        onChange={handleEmailChange}
                        required
                    />
                </div>
                                    
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem"
                }}>
                    <label>Your city name:</label>
                    <input
                        type="text"
                        placeholder="Enter your city"
                        value={city}
                        onChange={handleCityChange}
                        required
                    />
                </div>

                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem"
                }}>
                    <label>Password:</label>
                    <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    />
                </div>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem"
                }}>
                    <label>Confirm Password:</label>
                    <input
                    type="password"
                    placeholder="Reenter the password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                    />
                </div>
                <div style={{display: "flex", gap: "1rem", justifyContent: "flex-end"}}>
                    <button type="submit">Submit</button>
                    <button type="button" onClick={handleClear}>Clear</button>
                </div>
            </form>
        </div>
    </div>
    </>
  );
};

export default RegistrationForm;
