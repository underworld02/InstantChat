var uname = "window";
var object = {
    uname: "object",
    fun: function() {
        console.log(this);
        console.log(this.uname);
        return function() {
            console.log(this);
            console.log(this.uname);
        }
    }
}
object.fun()();
