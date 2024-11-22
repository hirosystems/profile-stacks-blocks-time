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


## TO-DOs
- Naka 4 Interpreter
- Naka 5 WASM Results

