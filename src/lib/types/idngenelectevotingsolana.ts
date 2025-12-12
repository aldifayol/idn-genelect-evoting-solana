/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/idngenelectevotingsolana.json`.
 */
export type Idngenelectevotingsolana = {
  "address": "Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe",
  "metadata": {
    "name": "idngenelectevotingsolana",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "activateElection",
      "docs": [
        "Activate the election (requires commissioner authority)"
      ],
      "discriminator": [
        36,
        161,
        155,
        178,
        67,
        48,
        187,
        131
      ],
      "accounts": [
        {
          "name": "commissioner",
          "signer": true
        },
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "election.election_name",
                "account": "election"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "auditVerification",
      "docs": [
        "Admin function to audit AI verification integrity (for testing)",
        "Only accessible by election commissioners"
      ],
      "discriminator": [
        148,
        170,
        218,
        236,
        35,
        189,
        67,
        154
      ],
      "accounts": [
        {
          "name": "commissioner",
          "signer": true
        },
        {
          "name": "election",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "election.election_name",
                "account": "election"
              }
            ]
          },
          "relations": [
            "voterCredential"
          ]
        },
        {
          "name": "voterCredential",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  95,
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "voter_credential.voter_authority",
                "account": "voterCredential"
              }
            ]
          }
        }
      ],
      "args": [],
      "returns": {
        "defined": {
          "name": "auditData"
        }
      }
    },
    {
      "name": "castVote",
      "docs": [
        "Cast an anonymous vote",
        "Separates voter identity from vote choice for ballot secrecy"
      ],
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "election.election_name",
                "account": "election"
              }
            ]
          },
          "relations": [
            "voterCredential",
            "candidate"
          ]
        },
        {
          "name": "voterCredential",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  95,
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "candidate",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  110,
                  100,
                  105,
                  100,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "candidate.candidate_id",
                "account": "candidate"
              }
            ]
          }
        },
        {
          "name": "ballot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  108,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "election.total_votes_cast",
                "account": "election"
              }
            ]
          }
        },
        {
          "name": "votingTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  105,
                  110,
                  103,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "election"
              }
            ]
          }
        },
        {
          "name": "voterTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "voter"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "votingTokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "encryptedVoteData",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "close",
      "discriminator": [
        98,
        165,
        201,
        177,
        108,
        65,
        206,
        96
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "idngenelectevotingsolana",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "decrement",
      "discriminator": [
        106,
        227,
        168,
        59,
        248,
        27,
        150,
        101
      ],
      "accounts": [
        {
          "name": "idngenelectevotingsolana",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "finalizeElection",
      "docs": [
        "Finalize election and close voting (requires commissioner authority)"
      ],
      "discriminator": [
        175,
        212,
        115,
        202,
        87,
        250,
        48,
        167
      ],
      "accounts": [
        {
          "name": "commissioner",
          "signer": true
        },
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "election.election_name",
                "account": "election"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "increment",
      "discriminator": [
        11,
        18,
        104,
        9,
        104,
        174,
        59,
        33
      ],
      "accounts": [
        {
          "name": "idngenelectevotingsolana",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "idngenelectevotingsolana",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeElection",
      "docs": [
        "Initialize a new election with multi-sig commissioners"
      ],
      "discriminator": [
        59,
        166,
        191,
        126,
        195,
        0,
        153,
        168
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "electionName"
              }
            ]
          }
        },
        {
          "name": "votingTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  105,
                  110,
                  103,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "election"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "electionName",
          "type": "string"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        },
        {
          "name": "commissioners",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "requiredSignatures",
          "type": "u8"
        }
      ]
    },
    {
      "name": "registerCandidate",
      "docs": [
        "Register a candidate for the election (requires commissioner authority)"
      ],
      "discriminator": [
        91,
        136,
        96,
        222,
        242,
        4,
        160,
        182
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "election"
          ]
        },
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "election.election_name",
                "account": "election"
              }
            ]
          }
        },
        {
          "name": "candidate",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  110,
                  100,
                  105,
                  100,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "arg",
                "path": "candidateId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "candidateName",
          "type": "string"
        },
        {
          "name": "candidateId",
          "type": "u32"
        }
      ]
    },
    {
      "name": "set",
      "discriminator": [
        198,
        51,
        53,
        241,
        116,
        29,
        126,
        194
      ],
      "accounts": [
        {
          "name": "idngenelectevotingsolana",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "value",
          "type": "u8"
        }
      ]
    },
    {
      "name": "verifyBallotReceipt",
      "docs": [
        "Voter can verify their vote was counted using their receipt"
      ],
      "discriminator": [
        206,
        251,
        106,
        215,
        66,
        208,
        187,
        158
      ],
      "accounts": [
        {
          "name": "voter",
          "signer": true
        },
        {
          "name": "election",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "election.election_name",
                "account": "election"
              }
            ]
          },
          "relations": [
            "voterCredential",
            "ballot"
          ]
        },
        {
          "name": "voterCredential",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  95,
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "ballot",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  108,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "ballot.ballot_sequence",
                "account": "ballot"
              }
            ]
          }
        }
      ],
      "args": [],
      "returns": {
        "defined": {
          "name": "receiptVerification"
        }
      }
    },
    {
      "name": "verifyVoter",
      "docs": [
        "Verify voter biometrics and mint Voter Credential NFT",
        "Stores cryptographic hashes on-chain, actual biometric data off-chain"
      ],
      "discriminator": [
        241,
        106,
        147,
        53,
        202,
        30,
        139,
        19
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "election.election_name",
                "account": "election"
              }
            ]
          }
        },
        {
          "name": "voterCredential",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  95,
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "votingTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  105,
                  110,
                  103,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "election"
              }
            ]
          }
        },
        {
          "name": "voterTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "voter"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "votingTokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "voterNik",
          "type": "string"
        },
        {
          "name": "biometricHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "photoIpfsHash",
          "type": "string"
        },
        {
          "name": "verificationTimestamp",
          "type": "i64"
        },
        {
          "name": "aiConfidenceScore",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ballot",
      "discriminator": [
        3,
        232,
        121,
        204,
        232,
        137,
        138,
        164
      ]
    },
    {
      "name": "candidate",
      "discriminator": [
        86,
        69,
        250,
        96,
        193,
        10,
        222,
        123
      ]
    },
    {
      "name": "election",
      "discriminator": [
        68,
        191,
        164,
        85,
        35,
        105,
        152,
        202
      ]
    },
    {
      "name": "idngenelectevotingsolana",
      "discriminator": [
        68,
        24,
        205,
        123,
        43,
        207,
        64,
        107
      ]
    },
    {
      "name": "voterCredential",
      "discriminator": [
        173,
        196,
        155,
        186,
        118,
        40,
        56,
        23
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidCommissionerCount",
      "msg": "Invalid number of commissioners"
    },
    {
      "code": 6001,
      "name": "invalidElectionPeriod",
      "msg": "Election period is invalid"
    },
    {
      "code": 6002,
      "name": "nameTooLong",
      "msg": "Name is too long"
    },
    {
      "code": 6003,
      "name": "electionAlreadyActive",
      "msg": "Election is already active"
    },
    {
      "code": 6004,
      "name": "electionNotActive",
      "msg": "Election is not active"
    },
    {
      "code": 6005,
      "name": "electionNotStarted",
      "msg": "Election has not started yet"
    },
    {
      "code": 6006,
      "name": "electionStillActive",
      "msg": "Election is still active"
    },
    {
      "code": 6007,
      "name": "invalidNik",
      "msg": "Invalid NIK format (must be 16 digits)"
    },
    {
      "code": 6008,
      "name": "invalidIpfsHash",
      "msg": "Invalid IPFS hash"
    },
    {
      "code": 6009,
      "name": "invalidConfidenceScore",
      "msg": "Invalid confidence score (must be 0-100)"
    },
    {
      "code": 6010,
      "name": "registrationClosed",
      "msg": "Voter registration is closed"
    },
    {
      "code": 6011,
      "name": "alreadyVoted",
      "msg": "Voter has already voted"
    },
    {
      "code": 6012,
      "name": "voterNotVerified",
      "msg": "Voter is not verified"
    },
    {
      "code": 6013,
      "name": "votingPeriodInvalid",
      "msg": "Voting period is invalid"
    },
    {
      "code": 6014,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "auditData",
      "docs": [
        "Audit data returned for commissioner review (testing AI integrity)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voterNikHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "biometricHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "aiConfidenceScore",
            "type": "u8"
          },
          {
            "name": "verificationTimestamp",
            "type": "i64"
          },
          {
            "name": "hasVoted",
            "type": "bool"
          },
          {
            "name": "isVerified",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "ballot",
      "docs": [
        "Anonymous ballot record",
        "Deliberately separates voter identity from vote choice"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "election",
            "type": "pubkey"
          },
          {
            "name": "candidate",
            "type": "pubkey"
          },
          {
            "name": "encryptedVoteData",
            "docs": [
              "Encrypted vote data for additional privacy layer"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "ballotSequence",
            "docs": [
              "Sequential ballot number for counting verification"
            ],
            "type": "u64"
          },
          {
            "name": "verificationReceipt",
            "docs": [
              "Receipt hash that voter can use to verify their vote was counted"
            ],
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "candidate",
      "docs": [
        "Candidate account for election participants"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "election",
            "type": "pubkey"
          },
          {
            "name": "candidateId",
            "type": "u32"
          },
          {
            "name": "candidateName",
            "type": "string"
          },
          {
            "name": "voteCount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "election",
      "docs": [
        "Main Election account storing election metadata and configuration"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "electionName",
            "type": "string"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "totalRegisteredVoters",
            "type": "u64"
          },
          {
            "name": "totalVotesCast",
            "type": "u64"
          },
          {
            "name": "commissioners",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "requiredSignatures",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "idngenelectevotingsolana",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "count",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "receiptVerification",
      "docs": [
        "Receipt verification response for voters"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isValid",
            "type": "bool"
          },
          {
            "name": "ballotSequence",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "verificationCode",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "voterCredential",
      "docs": [
        "Voter Credential NFT - stores cryptographic proofs, not raw biometric data",
        "Acts as proof of identity verification"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "election",
            "type": "pubkey"
          },
          {
            "name": "voterAuthority",
            "type": "pubkey"
          },
          {
            "name": "voterNikHash",
            "docs": [
              "SHA-256 hash of voter NIK (National Identity Number)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "biometricHash",
            "docs": [
              "SHA-256 hash of combined biometric data (retina + face + fingerprint)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "photoIpfsHash",
            "docs": [
              "IPFS hash pointing to encrypted selfie photo + ID card"
            ],
            "type": "string"
          },
          {
            "name": "isVerified",
            "type": "bool"
          },
          {
            "name": "hasVoted",
            "type": "bool"
          },
          {
            "name": "verificationTimestamp",
            "type": "i64"
          },
          {
            "name": "voteTimestamp",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "aiConfidenceScore",
            "docs": [
              "AI confidence score (0-100) for audit purposes"
            ],
            "type": "u8"
          },
          {
            "name": "verificationCode",
            "docs": [
              "Unique verification code for voter to confirm their registration"
            ],
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
