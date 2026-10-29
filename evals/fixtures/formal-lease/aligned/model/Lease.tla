---- MODULE Lease ----
EXTENDS FiniteSets

CONSTANTS Ids

VARIABLE holders

Init == holders = {}

Claim(id) == holders = {} /\ holders' = {id}

Release(id) == id \in holders /\ holders' = holders \ {id}

Use(id) == id \in holders /\ Cardinality(holders) = 1 /\ UNCHANGED holders

Next == \E id \in Ids : Claim(id) \/ Release(id) \/ Use(id)

SingleOwner == Cardinality(holders) <= 1
====
