# Block Limit Testing Strategy

## Goal
Test transaction combinations that approach but don't exceed block limits across all 5 dimensions.

## Optimal Transaction Mix
After multiple iterations, the optimal combination was determined to be 19 transactions of each of these 4 types:
- read-count-test
- read-length-test
- write-length-test
- computation-test

Note: Unable to include write-count-test as no contract call was found where `write-count > read-count`.

## Resource Utilization
This combination results in the following block limit usage:
| Resource      | Usage    | % of Limit |
|---------------|----------|------------|
| Write length  | 10.2M    | 68%       |
| Write count   | 4,921    | 33%       |
| Read length   | 57.4M    | 57%       |
| Read count    | 10,184   | 68%       |
| Runtime       | 227.8M   | 6.5%      |

This distribution maximizes block usage while maintaining equal numbers of each transaction type and staying under all limits.

## Environment comparison (same infrastructure)
- Naka 4 Interpreter
- Naka 5 WASM


## Results


### Naka 4 Interpreter

Positive Deltas Node
Min: 1, Max: 144, Average: 78.09433962264151, Median: 81

All Deltas Node
Min: 0, Max: 144, Average: 55.18666666666667, Median: 10

Local User Benchmark
Min: 13, Max: 154, Average: 92.60377358490567, Median: 105

Positive Transactions by minute intervals:
1 minute(s): 23 transactions
2 minute(s): 10 transactions
3 minute(s): 20 transactions

All Transactions by minute intervals:
1 minute(s): 23 transactions
2 minute(s): 10 transactions
3 minute(s): 20 transactions

READ COUNT:
Min: 5, Max: 505, Average: 140.71, Median: 17

READ LENGTH:
Min: 87992, Max: 2213292, Average: 487251.72, Median: 88283

RUNTIME:
Min: 163412, Max: 4956084, Average: 1827538.92, Median: 378812

WRITE COUNT:
Min: 2, Max: 8, Average: 3.52, Median: 2

WRITE LENGTH:
Min: 24, Max: 400, Average: 119.25, Median: 24


### Naka 5 WASM Results

Positive Deltas Node
Min: 11, Max: 34, Average: 23.546666666666667, Median: 28

All Deltas Node
Min: 11, Max: 34, Average: 23.546666666666667, Median: 28

Local User Benchmark
Min: 35, Max: 57, Average: 47.733333333333334, Median: 48

Positive Transactions by minute intervals:
1 minute(s): 75 transactions

All Transactions by minute intervals:
1 minute(s): 75 transactions

READ COUNT:
Min: 3, Max: 3, Average: 3.00, Median: 3

READ LENGTH:
Min: 87975, Max: 87975, Average: 87975.00, Median: 87975

RUNTIME:
Min: 88054, Max: 88054, Average: 88054.00, Median: 88054
