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


**Tx time to be anchored**
| Metric              | Min | Max | Average | Median | Unit |
|---------------------|-----|-----|---------|--------|------|
| Positive Deltas Node| 5   | 129 | 107.52  | 127    | s    |
| All Deltas Node     | 5   | 129 | 107.52  | 127    | s    |
| Local User Benchmark| 28  | 139 | 120.04  | 135    | s    |

---

**Transactions Distribution**
| Time Window | Transaction Count|
|-------------|------------------|
| 1 minute    | 10               |
| 2 minutes   | 9                |
| 3 minutes   | 56               |

---

**Resource Metrics**
| Metric       | Min      | Max       | Average     | Median    | Total      | Unit     |
|--------------|----------|-----------|-------------|-----------|------------|----------|
| Read Count   | 5        | 505       | 140.71      | 17        | 10,553     | ops      |
| Read Length  | 87,992   | 96,992    | 91,378.39   | 88,283    | 6,853,379  | bytes    |
| Runtime      | 163,412  | 4,956,084 | 1,431,665.59| 172,941   | 107,374,919| [?]      |
| Write Count  | 2        | 8         | 3.52        | 2         | 264        | ops      |
| Write Length | 24       | 400       | 119.25      | 24        | 8,944      | bytes    |

### Naka 5 WASM

**Tx time to be anchored**
| Metric              | Min | Max | Average | Median | Unit |
|---------------------|-----|-----|---------|--------|------|
| Positive Deltas Node| 11  | 34  | 23.55   | 28     | s    |
| All Deltas Node     | 11  | 34  | 23.55   | 28     | s    |
| Local User Benchmark| 35  | 57  | 47.73   | 48     | s    |

---

**Transactions Distribution**
| Time Window | Transaction Count|
|-------------|------------------|
| 1 minute    | 75               |

---

**Resource Metrics**
| Metric       | Min    | Max    | Average | Median | Total    | Unit    |
|--------------|--------|--------|---------|--------|----------|---------|
| Read Count   | 3      | 3      | 3.00    | 3      | 225      | ops     |
| Read Length  | 87,975 | 87,975 | 87,975  | 87,975 | 6,598,125| bytes   |
| Runtime      | 88,054 | 88,054 | 88,054  | 88,054 | 6,604,050| [?]     |
