// 에러 핸들링 추가.
export default function(err, req, res, next) {
    try {
        if(err.name === 'ValidationError'){
            return res.status(400).json({ errorMessage: " 데이터 형식이 올바르지 않습니다. " })
        } else if (err.name === "ExistMember") {
            return res.status(409).json({ errorMessage: " 중복된 사용자 이름 입니다. " })
        } else if (err.name === "Duplication") {
            return res.status(409).json({ errorMessage: " 비밀번호에 시용자 이름 같은 값이 포함 되어 있습니다." })
        } else if (err.name === "EmailError") {
            return res.status(409).json({ errorMessage: " 이메일이 일치 하지 않습니다. " })
        } else if (err.name === "passWordError") {
            return res.status(409).json({ errorMessage: " 비밀번호가 일치 하지 않습니다. " })
        } else if (err.name === "ExistNickName") {
            return res.status(409).json({ errorMessage: " 중복된 닉네임 입니다. " })
        } else if (err.name === "NoneData") {
            return res.status(400).json({ errorMessage: " 존재 하지 않는 데이터 입니다. " })
        }else if (err.name === "unQualified") {
            return res.status(400).json({ errorMessage: " 입력 조건을 확인해 주세요. " })
        }else if (err.name === "noAccess") {
            return res.status(400).json({ errorMessage: " 작성자가 아닙니다. " })
        }
            next(err)
    } catch (err) {
        res.status(500).json({ errorMessage: '서버 내부 에러가 발생했습니다.' })
    }
}