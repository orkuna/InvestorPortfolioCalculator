----------
Usage:

npm install

node index.js --token=ETH --date=1571965053

-----------
Node version:

v12.13.0

Design Decisions:

- First we need to parse the input csv file. Since it may be very big, I decided not to take it into memory but instead; read it line by line as a stream.

- Next, we need to calculate balances on the way while reading lines. If we have a date limit, we consider it on each line since the input file may not be ordered by date.

- If we are done calculating the balances until the specified date; now we need to know the prices of each token on that date. Technically we need to make multiple rest API calls and wait for all to finish; before continuing. For that I used promises (promises.all) to wait all api calls to finish and used that price data to calculate the resulting portfolio values.
