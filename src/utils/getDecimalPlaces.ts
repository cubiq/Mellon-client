
const getDecimalPlaces = (value: number | undefined) => {
    if (!value) return 1;
    const str = value.toString();
    
    // Handle scientific notation (e.g., 1.23e-4)
    if (str.includes('e-')) {
        const [mantissa, exponent] = str.split('e-');
        const mantissaDecimals = mantissa.includes('.') ? mantissa.split('.')[1].length : 0;
        return mantissaDecimals + Number(exponent);
    }
    
    // Handle regular decimals (e.g., 0.001)
    const decimals = str.split('.')[1];
    return decimals ? decimals.length : 0;
};

export default getDecimalPlaces;