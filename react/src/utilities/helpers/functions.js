export const LocalUser = () => {
    let obj = localStorage.getItem("User");
    let user = obj ? JSON.parse(obj)?.user : null;
    return user;
}