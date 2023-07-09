
class ListaCustomizada(list):
    def __add__(self, outro):
        if (isinstance(outro, list)):
            return ListaCustomizada(super().__add__(outro))
        else:
            res = self.copy()
            res.append(outro)
            return ListaCustomizada(res)

    def __sub__(self, outro):
        res = self.copy()
        res.remove(outro)
        return ListaCustomizada(res)

a = ListaCustomizada()
b = 5
res = a + b # pyright: ignore
print(type(res))
print(res)
res = res - b # pyright: ignore
print(type(res))
print(res)
