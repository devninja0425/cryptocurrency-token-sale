module.exports = async (callback) => {
    if (typeof callback == "undefined") {
        assert(false, "Callback is undefined");
    } else {
        try {
            await callback();
        } catch (error) {
            assert(error.message.indexOf("revert") > 0);
        }
    }
};