"""
4 bit - nonce
0x0000
"""
from collections import defaultdict

original_map = {}
for i in range(2**4):
    original_map[i] = 1
print(len(original_map))


bm = defaultdict(int)


def _markNonceAsUsed(nonce):
    groupKey = nonce // 4
    indexInGroup = nonce % 4
    group = bm[groupKey]

    if (group >> indexInGroup) & 1 == 1:
        return False

    bm[groupKey] = group | (1 << indexInGroup)
    return True


for i in range(2**4):
    _markNonceAsUsed(i)

print(len(bm))


# set 1,4,5,8,13
original_map = {}
nonces = [1, 4, 5, 8, 13]
for n in nonces:
    original_map[n] = True

bm = defaultdict(int)
for n in nonces:
    _markNonceAsUsed(n)

print(original_map, len(original_map))
print(bm, len(bm))
